import { Route } from '@/types';
import ofetch from '@/utils/ofetch'; // 统一使用的请求库

export const route: Route = {
    // 路由信息
    path: '/ghhzrzy', // 添加你的路由路径
    name: 'Ghhzrzy', // 人类可读的名称
    url: 'ghhzrzy.tj.gov.cn', // 不包含协议的 URL
    description: 'Ghhzrzy 官方信息 RSS 源', // 可选描述
    handler: async (ctx) => {
        // 在此处编写路由处理函数
        const response = await ofetch('https://ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/'); // 根据需要替换获取数据的方式
        // 解析响应内容
        // 返回 RSS 需要的信息
        return {
            title: 'Ghhzrzy 信息',
            link: 'https://ghhzrzy.tj.gov.cn/',
            items: [] // 在这里填充获取到的项目
        };
    },
};