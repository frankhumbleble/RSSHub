import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';
import cache from '@/utils/cache';

const rootUrl = 'https://ghhzrzy.tj.gov.cn';
const config = {
    jjzcwj: {
        link: '/zwgk_143/zcwj/jjzcwj/',  // 原网站的路径包含 zwgk_143，需保留
        title: '经济政策文件',
    }
};

export const route: Route = {
    // 路径包含 zwgk，与访问路径匹配（关键修正）
    path: '/tianjin/ghhzrzy/zwgk/:caty',
    categories: ['government'],
    // 示例路径与路由 path 一致（修正重复 example 问题）
    example: '/tianjin/ghhzrzy/zwgk/jjzcwj',
    parameters: { caty: '信息类别，目前支持 jjzcwj（经济政策文件）' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    // radar.target 与路由 path 匹配（关键修正）
    radar: [{
        source: ['ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/'],
        target: '/tianjin/ghhzrzy/zwgk/jjzcwj',
    }],
    name: '天津市规划和自然资源局 - 政务公开',
    maintainers: ['你的GitHub用户名'],  // 替换为你的用户名
    handler,
    url: 'ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/',
    description: '天津市规划和自然资源局经济政策文件订阅',
};

async function handler(ctx) {
    const caty = ctx.req.param('caty');
    const cfg = config[caty];
    
    if (!cfg) {
        throw new Error('无效的分类，仅支持 jjzcwj');
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