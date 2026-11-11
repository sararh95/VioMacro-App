// Decoupled to prevent circular dependencies
import { useMemo } from 'react';

interface IngredientStub {
    item: string;
    display?: string;
}

interface SmartTextProps {
    text: string;
    ingredients?: IngredientStub[];
    className?: string;
}

const TEMP_REGEX = /\b(\d{2,3})\s*(?:deg)?\s*([CF])\b/i;
const TIME_REGEX = /\b(\d+(?:-\d+)?(?:\.\d+)?)\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?)\b/i;

export function SmartText({ text, ingredients = [], className = '' }: SmartTextProps) {
    const parts = useMemo(() => {
        if (!text) return [];

        const ingredientNames = ingredients
            .map(i => i.item.trim())
            .filter(name => name.length > 2)
            .sort((a, b) => b.length - a.length);

        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const ingredientPattern = ingredientNames.length > 0
            ? new RegExp(`\\b(${ingredientNames.map(escapeRegExp).join('|')})\\b`, 'gi')
            : null;

        const tokens: { type: 'text' | 'temp' | 'time' | 'ingredient'; content: string }[] = [];
        let cursor = 0;

        while (cursor < text.length) {
            const substring = text.slice(cursor);
            let bestMatch: { type: 'temp' | 'time' | 'ingredient'; match: RegExpExecArray } | null = null;
            let minIndex = Infinity;

            const tempMatch = TEMP_REGEX.exec(substring);
            if (tempMatch && tempMatch.index < minIndex) {
                minIndex = tempMatch.index;
                bestMatch = { type: 'temp', match: tempMatch };
            }

            const timeMatch = TIME_REGEX.exec(substring);
            if (timeMatch && timeMatch.index < minIndex) {
                minIndex = timeMatch.index;
                bestMatch = { type: 'time', match: timeMatch };
            }

            if (ingredientPattern) {
                ingredientPattern.lastIndex = 0;
                const ingMatch = ingredientPattern.exec(substring);
                if (ingMatch && ingMatch.index < minIndex) {
                    minIndex = ingMatch.index;
                    bestMatch = { type: 'ingredient', match: ingMatch };
                }
            }

            if (!bestMatch) {
                tokens.push({ type: 'text', content: substring });
                break;
            }

            if (bestMatch.match.index > 0) {
                tokens.push({ type: 'text', content: substring.slice(0, bestMatch.match.index) });
            }

            tokens.push({ type: bestMatch.type, content: bestMatch.match[0] });
            cursor += bestMatch.match.index + bestMatch.match[0].length;
        }

        return tokens;
    }, [text, ingredients]);

    return (
        <span className={className}>
            {parts.map((token, i) => {
                switch (token.type) {
                    case 'temp':
                        return <span key={i} className="font-bold text-red-500 dark:text-red-400">{token.content}</span>;
                    case 'time':
                        return <span key={i} className="font-bold text-orange-500 dark:text-orange-400">{token.content}</span>;
                    case 'ingredient': {
                        const matchedIng = ingredients.find(item => item.item.toLowerCase() === token.content.toLowerCase());
                        const tooltip = matchedIng?.display || token.content;

                        return (
                            <span
                                key={i}
                                className="font-bold text-primary dark:text-[#13ec5b] border-b border-primary/20 cursor-help relative group/tooltip"
                            >
                                {token.content}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                    {tooltip}
                                </span>
                            </span>
                        );
                    }
                    default:
                        return <span key={i}>{token.content}</span>;
                }
            })}
        </span>
    );
}
