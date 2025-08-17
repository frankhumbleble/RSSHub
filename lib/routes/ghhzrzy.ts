import { Route } from '@/types';
import ofetch from '@/utils/ofetch'; // 引入请求库
import { load } from 'cheerio'; // 用于解析 HTML
import { parseDate } from '@/utils/parse-date'; // 用于解析日期

export const route: Route = {
    // 路由信息
    path: '/ghhzrzy', // 路由的基本路径
    name: 'Ghhzrzy', // 名称
    url: 'ghhzrzy.tj.gov.cn', // 基础 URL
    description: 'Ghhzrzy 官方信息 RSS 源', // 描述
    handler: async (ctx) => {
        const response = await ofetch('https://ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/');
        const $ = load(response); // 加载 HTML 响应
        
        // 假设我们要解析每个条目的标题和链接，这需要根据具体的 HTML 结构来编写
        const items = $('selector-for-your-items') // 根据实际情况调整选择器
            .map((_, item) => {
                const title = $(item).find('selector-for-title').text();
                const link = $(item).find('selector-for-link').attr('href');
                const pubDate = parseDate($(item).find('selector-for-date').text());
                return {
                    title,
                    link,
                    pubDate,
                };
            })
            .get(); // 将 jQuery 对象转换为数组

        return {
            title: 'Ghhzrzy 信息',
            link: 'https://ghhzrzy.tj.gov.cn/',
            items, // 返回解析后的所有项
        };
    },
};

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

// 启用请求拦截
await page.setRequestInterception(true);
page.on('request', (request) => {
    request.resourceType() === 'document' ? request.continue() : request.abort();
});

await page.goto('https://ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/', {
    waitUntil: 'domcontentloaded',
});

// 解析页面内容
const content = await page.content();
const $ = load(content);
// 在此继续使用 jQuery 选择器等进行数据解析