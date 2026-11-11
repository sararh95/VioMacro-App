/**
 * Locally generated visuals — no network, no third party.
 *
 * The app used to fetch placeholder food photos from Unsplash and avatars from
 * DiceBear (AUD-072, AUD-091, AUD-104, AUD-116, AUD-117, AUD-118). Both leaked
 * the viewer's IP and referrer to a host that has nothing to do with VioMacro,
 * and both would break the day a photo id was retired. Worse, one of them was
 * *written into the database* as the user's own recipe image.
 *
 * Everything here is computed from data the app already has, so it renders
 * offline, costs no request, and cannot rot.
 */

/** Stable, non-cryptographic hash. Same input always gives the same colour. */
function hash(seed: string): number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}

// ------------------------------------------------------------------ recipes

export type Macroish = { protein?: number; carbs?: number; fat?: number };

/**
 * Which macro this recipe leans on. Used to tint its panel, so the library
 * grid reads at a glance: blue-ish cards are the high-protein ones.
 */
export function dominantMacro(macros: Macroish): 'protein' | 'carbs' | 'fat' | 'balanced' {
    const p = (macros.protein ?? 0) * 4;
    const c = (macros.carbs ?? 0) * 4;
    const f = (macros.fat ?? 0) * 9;
    const total = p + c + f;
    if (total <= 0) return 'balanced';

    const top = Math.max(p, c, f);
    if (top / total < 0.4) return 'balanced';
    if (top === p) return 'protein';
    if (top === c) return 'carbs';
    return 'fat';
}

const MACRO_GRADIENT: Record<ReturnType<typeof dominantMacro>, string> = {
    protein: 'linear-gradient(145deg, #23405F 0%, #16202C 100%)',
    carbs: 'linear-gradient(145deg, #5A4419 0%, #221D12 100%)',
    fat: 'linear-gradient(145deg, #542C3E 0%, #241820 100%)',
    balanced: 'linear-gradient(145deg, #33265C 0%, #1A1626 100%)',
};

/**
 * CSS styles for a recipe with no image of its own.
 *
 * Deliberately uses a gradient rather than a URL: a caller cannot
 * accidentally persist this into Firestore as an imageUrl, which is exactly
 * how AUD-116 happened.
 */
export function recipeTint(macros: Macroish, seed = ''): { background: string; filter?: string } {
    const base = MACRO_GRADIENT[dominantMacro(macros)];
    if (!seed) return { background: base };
    // Rotate the hue slightly per recipe so a grid of similar recipes still
    // looks varied, without ever leaving the macro's colour family.
    const shift = (hash(seed) % 24) - 12;
    return { background: base, filter: `hue-rotate(${shift}deg)` };
}

/** The letter shown on an image-less recipe panel. */
export function recipeInitial(title: string): string {
    const trimmed = title.trim();
    return trimmed ? trimmed[0].toUpperCase() : '?';
}

// ------------------------------------------------------------------ avatars

/** Up to two initials from a display name, or a fallback. */
export function initialsFrom(name: string | null | undefined): string {
    if (!name?.trim()) return 'U';
    return name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * A stable avatar background for a user. Derived from their uid so it never
 * changes, and drawn from the app's own palette rather than a random hue.
 */
export function avatarGradient(seed: string | null | undefined): string {
    const palette = [
        'linear-gradient(135deg, #A78BFA 0%, #6D4FD1 100%)',
        'linear-gradient(135deg, #6BA5F7 0%, #3D6FC0 100%)',
        'linear-gradient(135deg, #E0719C 0%, #B14872 100%)',
        'linear-gradient(135deg, #F0B429 0%, #B8811A 100%)',
        'linear-gradient(135deg, #4FC3E8 0%, #2A8CAD 100%)',
        'linear-gradient(135deg, #5CC98E 0%, #339166 100%)',
    ];
    return palette[hash(seed || 'anonymous') % palette.length];
}

/** The six avatar choices offered in Settings, as local values. */
export const AVATAR_CHOICES = ['violet', 'blue', 'rose', 'amber', 'cyan', 'green'] as const;
export type AvatarChoice = (typeof AVATAR_CHOICES)[number];

export function avatarGradientByName(choice: string): string {
    const index = AVATAR_CHOICES.indexOf(choice as AvatarChoice);
    return avatarGradient(index >= 0 ? String(index) : choice);
}

/**
 * Should this stored avatar value be rendered as an `<img>`?
 *
 * Only a genuine https URL from a source we trust — for example a future
 * Google sign-in photo. A stored DiceBear URL is explicitly excluded: existing
 * profiles saved one before AUD-104 was fixed, and rendering it would keep
 * calling that third party on every page view. Those fall back to initials.
 */
export function isRemoteAvatar(value: string | null | undefined): boolean {
    if (!value) return false;
    if (!value.startsWith('https://')) return false;      // local colour name
    if (value.includes('dicebear.com')) return false;     // legacy, do not fetch
    return true;
}

// ------------------------------------------------------------ stored images

/** Hosts an image may legitimately come from. Mirrors the CSP in index.html. */
const RENDERABLE_IMAGE_HOSTS = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
];

/**
 * Should this stored imageUrl actually be requested?
 *
 * Recipes saved before PR-3 carry a third-party stock-photo URL, because
 * RecipeForm used to write one whenever the image field was left blank
 * (AUD-116). Those values are still sitting in real databases. The CSP added
 * in PR-3 blocks them, so rendering one produces a broken image and a console
 * error for something the user never chose.
 *
 * Rather than loosen the CSP or migrate everyone's data, we simply decline to
 * request an image from a host we do not trust. A legacy URL now renders the
 * same generated tint as a recipe with no image at all — which is what the
 * user effectively had.
 */
export function isRenderableImage(url: string | null | undefined): boolean {
    if (!url) return false;
    if (url.startsWith('data:') || url.startsWith('blob:')) return true;
    if (url.startsWith('/')) {
        // Browsers ignore tabs/newlines and treat backslashes as slashes in
        // HTTP URLs. A network path must not be mistaken for a local asset.
        const path = url.replace(/[\t\r\n]/g, '').replace(/\\/g, '/');
        return !path.startsWith('//');
    }
    try {
        const { hostname, protocol } = new URL(url);
        if (protocol === 'http:' && (hostname === '127.0.0.1' || hostname === 'localhost')) {
            return true;                                        // Storage emulator
        }
        return protocol === 'https:' && RENDERABLE_IMAGE_HOSTS.includes(hostname);
    } catch {
        return false;                                           // not a URL at all
    }
}
