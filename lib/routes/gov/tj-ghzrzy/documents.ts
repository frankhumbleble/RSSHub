// lib/routes/tj-ghzrzy/documents.ts
import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

const baseUrl = 'http://ghzrzy.tj.gov.cn';

export const route: Route = {
    path: '/tj-ghzrzy/documents',
    categories: ['government'],
    example: '/rsshub/tj-ghzrzy/documents',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: true, // 政府网站可能有反爬
    },
    radar: [
        {
            source: ['ghzrzy.tj.gov.cn/zwgk_143/xxgk/'],
            target: '/tj-ghzrzy/documents',
        },
    ],
    name: '局级文件',
    maintainers: ['您的GitHub用户名'],
    handler,
};

async function handler() {
    const url = `${baseUrl}/zwgk_143/xxgk/`;
    const response = await ofetch(url);
    const $ = load(response);

    // 解析文件列表
    const items = $('div.doc-list > div.doc-item')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const title = $item.find('.doc-title').text().trim();
            const link = $item.find('a').attr('href');
            const pubDate = parseDate($item.find('.doc-date').text(), 'YYYY-MM-DD');

            return {
                title,
                link: new URL(link, baseUrl).href,
                pubDate,
            };
        });

    return {
        title: '天津市规划和自然资源局 - 局级文件',
        link: url,
        item: items,
    };
}