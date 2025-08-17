import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

const baseUrl = 'http://ghzrzy.tj.gov.cn';

export const route: Route = {
    path: '/tj/ghzrzy/:channelId?', // 支持可选频道参数
    categories: ['government'],
    example: '/gov/tj/ghzrzy/jjwj', // 示例需明确参数
    parameters: { channelId: "频道ID，默认为'xxgk'" },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: true, // 启用反爬
    },
    radar: {
        source: ['ghzrzy.tj.gov.cn/zwgk_143/:channelId'],
        target: '/tj/ghzrzy/:channelId',
    },
    name: '局级文件',
    maintainers: ['YourGitHubUsername'], // 填写维护者
    handler,
};

async function handler(ctx) {
    const { channelId = 'xxgk' } = ctx.req.param(); // 默认频道
    const url = `${baseUrl}/zwgk_143/${channelId}/`;
    const response = await ofetch(url);
    const $ = load(response);

    const items = $('div.doc-list > div.doc-item')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const title = $item.find('.doc-title').text().trim();
            const link = $item.find('a').attr('href');
            return {
                title,
                link: link.startsWith('http') ? link : `${baseUrl}${link}`,
                pubDate: parseDate($item.find('.doc-date').text()), // 自动解析日期
            };
        });

    return {
        title: `天津市规划和自然资源局 - ${channelId}频道`,
        link: url,
        item: items,
    };
}