import { useEffect, useState, type ReactNode } from 'react';
import { isRenderableImage } from './visuals';

interface RecipeImageProps {
    imageUrl?: string;
    /** CSS backgrounds need a load probe because they do not emit image errors. */
    probe?: boolean;
    children: (source: string, onError: () => void) => ReactNode;
}

function ImageAttempt({ source, probe, children }: Omit<RecipeImageProps, 'imageUrl'> & { source: string }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!source || !probe) return;
        const image = new Image();
        image.onerror = () => setFailed(true);
        image.src = source;
        return () => { image.onerror = null; };
    }, [source, probe]);

    return children(failed ? '' : source, () => setFailed(true));
}

/** A changed URL starts a fresh attempt, including when returning to an old URL. */
export default function RecipeImage({ imageUrl, probe = false, children }: RecipeImageProps) {
    const source = isRenderableImage(imageUrl) ? imageUrl! : '';
    return <ImageAttempt key={source} source={source} probe={probe}>{children}</ImageAttempt>;
}
