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
    },
    // 可根据实际需要添加其他分类
};

export const route: Route = {
    path: '/tianjin/ghhzrzy/zwgk/:caty',
    categories: ['government'],
    example: '/gov/tianjin/ghhzrzy/zwgk/jjzcwj',
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
            target: '/tianjin/ghhzrzy/zwgk/jjzcwj',
        },
    ],
    name: '天津市规划和自然资源局 - 政务公开',
    maintainers: ['your-github-username'],
    handler,
    url: 'ghhzrzy.tj.gov.cn/zwgk_143/zcwj/jjzcwj/',
    description: '天津市规划和自然资源局政务公开信息订阅，目前支持经济政策文件分类',
};

async function handler(ctx) {
    const caty = ctx.req.param('caty');
    const cfg = config[caty];
    
    if (!cfg) {
        throw new Error('无效的分类，请参考文档使用正确的分类参数');
    }

    const currentUrl = new URL(cfg.link, rootUrl).href;
    const response = await got(currentUrl);
    const $ = load(response.data);

    // 提取列表信息
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

    // 获取详情页内容
    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const detailResponse = await got(item.link);
                const $detail = load(detailResponse.data);
                
                // 提取正文内容
                item.description = $detail('.article-content').html() || '暂无内容';
                
                // 提取附件信息（如果有）
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