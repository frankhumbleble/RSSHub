import { Route } from '@/types';

export const route: Route = {
    path: '/test',  // 极简路径
    categories: ['test'],
    example: '/test',
    parameters: {},
    features: { requireConfig: false },
    name: '测试路由',
    maintainers: ['你的名字'],
    handler: async () => ({
        title: '测试路由',
        link: 'https://example.com',
        item: [{ title: '测试内容', link: 'https://example.com' }],
    }),
};