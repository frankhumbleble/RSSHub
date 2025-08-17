import { Route } from '@/types';

export const route: Route = {
    path: '/tj-ghhzrzy/jjzcwj',  // 极简路径
    categories: ['government'],
    example: '/tj-ghhzrzy/jjzcwj',
    parameters: {},
    features: { requireConfig: false },
    name: '天津规划局测试',
    maintainers: ['你的名字'],
    handler: async () => ({
        title: '测试',
        link: 'https://ghhzrzy.tj.gov.cn',
        item: [{ title: '测试内容', link: 'https://ghhzrzy.tj.gov.cn' }],
    }),
};