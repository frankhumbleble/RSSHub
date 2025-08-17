import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';
import cache from '@/utils/cache';

const rootUrl = 'https://ghhzrzy.tj.gov.cn';
const config = {
    jjzcwj: {
        link: '/zwgk_143/zcwj/jjzcwj/',
        title: '经济政策文件',
    }
};

export const route: Route = {
    path: '/government/tianjin/ghhzrzy/zwgk/:caty',  // 关键：包含government层级
    categories: ['government'],
    example: '/government/tianjin/ghhzrzy/zwgk/jjzcwj',
    parameters: { caty: '信息类别，目前支持 jjzcwj（经济政策文件）' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/'],
            target: '/government/tianjin/ghhzrzy/zwgk/jjzcwj',
        },
    ],
    name: '天津市规划和自然资源局 - 政务公开',
    maintainers: ['your-name'],
    handler,
    url: 'ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/',
    description: '天津市规划和自然资源局政务公开信息订阅',
};

async function handler(ctx) {
    const caty = ctx.req.param('caty');
    const cfg = config[caty];
    
    if (!cfg) {
        throw new Error('无效的分类，请使用 jjzcwj');
    }

    const currentUrl = new URL(cfg.link, rootUrl).href;
    const response = await got(currentUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const $ = load(response.data);

    const list = $('.article-list li')
        .toArray()
        .map((item) => {
            const $item = $(item);
            const a = $item.find('a');
            const dateText = $item.find('.time').text().trim();
            
            return {
                title: a.attr('title') || a.text().trim(),
                link: new URL(a.attr('href'), rootUrl).href,
                pubDate: timezone(parseDate(dateText, 'YYYY-MM-DD'), +8),
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const detailResponse = await got(item.link, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const $detail = load(detailResponse.data);
                
                item.description = $detail('.article-content').html() || '暂无内容';
                
                const attachments = $detail('.attachment a')
                    .toArray()
                    .map((attach) => {
                        const $attach = $(attach);
                        return `<p>附件：<a href="${new URL($attach.attr('href'), rootUrl).href}">${$attach.text()}</a></p>`;
                    })
                    .join('');
                
                if (attachments) {
                    item.description += attachments;
                }
                
                return item;
            })
        )
    );

    return {
        title: `天津市规划和自然资源局 - ${cfg.title}`,
        link: currentUrl,
        item: items,
        allowEmpty: true,
    };
}
