import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import cache from '@/utils/cache';

export const route: Route = {
    path: '/tianjin/ghzrzy/zcfg/:category?',
    categories: ['government'],
    example: '/rsshub/tianjin/ghzrzy/zcfg',
    parameters: {
        category: {
            name: '文件类别',
            description: '可从URL路径获取，默认为最新政策',
            example: 'ghcg'
        }
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: true,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['ghzrzy.tj.gov.cn/ywpd/:category*/'],
            target: (params) => `/tianjin/ghzrzy/zcfg${params.category ? `/${params.category}` : ''}`
        }
    ],
    name: '政策法规',
    maintainers: ['YourName'],
    handler: async (ctx) => {
        const { category = 'cjxx_1' } = ctx.req.param();
        const baseUrl = 'http://ghzrzy.tj.gov.cn';
        const listUrl = `${baseUrl}/ywpd/${category}/`;

        const response = await ofetch(listUrl);
        const $ = load(response);

        // 获取分页信息
        const totalPages = parseInt($('.pagination li:last-child').prev().text() || '1');
        const currentPage = parseInt($('.pagination .active').text() || '1');
        
        // 获取列表项
        const items = $('.news-list li')
            .toArray()
            .map((item) => {
                const $item = $(item);
                const a = $item.find('a');
                const href = a.attr('href');
                const pubDate = $item.find('.date').text().trim();
                
                return {
                    title: a.text().trim(),
                    link: new URL(href, baseUrl).href,
                    pubDate: parseDate(pubDate, 'YYYY-MM-DD'),
                };
            });

        // 获取全文内容
        const result = await Promise.all(
            items.map((item) =>
                cache.tryGet(item.link, async () => {
                    try {
                        const detailResponse = await ofetch(item.link);
                        const $ = load(detailResponse);
                        
                        // 提取文件信息
                        const fileInfo = {};
                        $('.file-info li').each((i, el) => {
                            const text = $(el).text().trim();
                            const [label, ...valueParts] = text.split('：');
                            if (label && valueParts.length) {
                                fileInfo[label] = valueParts.join('：').trim();
                            }
                        });
                        
                        // 构建描述内容
                        let description = `
                            <h3>${item.title}</h3>
                            <div class="file-meta">
                                <p><strong>发布日期：</strong>${item.pubDate}</p>
                        `;
                        
                        Object.entries(fileInfo).forEach(([key, value]) => {
                            description += `<p><strong>${key}：</strong>${value}</p>`;
                        });
                        
                        description += '</div>';
                        
                        // 添加正文内容
                        const content = $('.article-content').html() || $('.TRS_Editor').html();
                        if (content) {
                            description += content;
                        }
                        
                        return {
                            ...item,
                            description,
                            category: Object.keys(fileInfo),
                        };
                    } catch (error) {
                        return item;
                    }
                })
            )
        );

        return {
            title: `天津市规划和自然资源局 - ${$('h1').text().trim()}`,
            link: listUrl,
            item: result,
            // 添加分页元数据
            meta: {
                currentPage,
                totalPages,
                nextPage: currentPage < totalPages ? `${listUrl}?page=${currentPage + 1}` : null
            }
        };
    },
};