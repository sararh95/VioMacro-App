import { Link } from 'react-router-dom';

const pages = [
    { name: 'Dashboard', path: '/', status: 'Audit Done' },
    { name: 'Plan', path: '/plan', status: 'Audit Done' },
    { name: 'Grocery List', path: '/grocery', status: 'Audit Done' },
    { name: 'Recipes', path: '/recipes', status: 'Audit Done' },
    { name: 'Progress', path: '/progress', status: 'Audit Done' },
    { name: 'Pantry', path: '/pantry', status: 'Audit Done' },
    { name: 'Settings', path: '/settings', status: 'Audit Done' },
    { name: 'Auth', path: '/auth', status: 'Audit Done' },
];

export default function ScreenMap() {
    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-6">Screen Map / Dev Playground</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.map((page) => (
                    <Link
                        key={page.path}
                        to={page.path}
                        className="p-4 bg-sidebar-dark border border-white/5 rounded-xl hover:border-primary/50 transition-all flex items-center justify-between group"
                    >
                        <div>
                            <div className="font-semibold group-hover:text-primary transition-colors">{page.name}</div>
                            <div className="text-sm text-gray-500 font-mono mt-1">{page.path}</div>
                        </div>
                        <div className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400 capitalize">
                            {page.status}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
