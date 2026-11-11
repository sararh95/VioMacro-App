import { recipeInitial, recipeTint, type Macroish } from '../../../shared/visuals';
import RecipeImage from '../../../shared/recipe-image';

interface RecipeThumbProps {
    title: string;
    imageUrl?: string;
    macros?: Macroish;
    className?: string;
    /** Font size for the fallback initial. */
    initialClassName?: string;
}

/**
 * A recipe image, or a locally generated stand-in when there isn't one.
 *
 * Before PR-3 each call site did `src={recipe.imageUrl || '<some unsplash url>'}`,
 * so a recipe with no photo of its own silently displayed a stranger's stock
 * image (AUD-072, AUD-117, AUD-118). Removing those URLs then exposed a second
 * problem: `src=""` makes the browser re-request the whole page, and React warns
 * about it. Both are handled here, once, instead of at five call sites.
 */
export default function RecipeThumb({
    title,
    imageUrl,
    macros = {},
    className = '',
    initialClassName = 'text-3xl',
}: RecipeThumbProps) {
    return (
        <RecipeImage imageUrl={imageUrl}>
            {(source, onError) => source ? (
                <img src={source} alt={title} className={className} onError={onError} />
            ) : (
                <div
                    role="img"
                    aria-label={`${title} — no photo`}
                    className={`flex items-center justify-center ${className}`}
                    style={recipeTint(macros, title)}
                >
                    <span className={`${initialClassName} font-black text-white/25 select-none`}>
                        {recipeInitial(title)}
                    </span>
                </div>
            )}
        </RecipeImage>
    );
}
