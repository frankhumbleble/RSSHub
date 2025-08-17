import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/tianjin/ghhzrzy/jjzcwj',
    categories: ['government'],
    example: '/gov/tianjin/ghhzrzy/jjzcwj',
    radar: [
        {
            source: ['ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/'],
        },
    ],
    name: '天津市规划和自然资源局-局级文件',
    maintainers: ['HaoyuLee'],
    description: '政务公开 > 政策文件 > 局级文件',
    async handler(ctx) {
        const baseUrl = 'https://ghhzrzy.tj.gov.cn';
        const currentUrl = `${baseUrl}/zwgk_143/zcwj/jjzcwj/`;
        const { data: response } = await got(currentUrl);

        const $ = load(response);
        const listItems = $('.doc_list li').toArray();

        const item = listItems.map((el) => {
            const element = $(el);
            const title = element.find('a').attr('title') || element.find('a').text().trim();
            const link = `${baseUrl}${element.find('a').attr('href')}`;
            const pubDateText = element.find('.date').text().trim();
            
            return {
                title: `局级文件：${title}`,
                link,
                pubDate: parseDate(pubDateText, 'YYYY-MM-DD'),
                author: '天津市规划和自然资源局',
                description: `
                    <h4>局级文件</h4>
                    <p>发布日期：${pubDateText}</p>
                    <a href="${link}">${title}</a>
                `,
            };
        });

        return {
            title: '天津市规划和自然资源局 - 局级文件',
            link: currentUrl,
            item,
        };
    },
};
