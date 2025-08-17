import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import cache from '@/utils/cache';

// 分类映射表
const categoryMap = {
    cjxx_1: '最新政策',
    ghcg: '规划成果',
    zcfg: '政策法规',
    bmgz: '部门规章',
    gfxwj: '规范性文件',
    zjqd: '资金渠道',
    gzdt_1: '工作动态'
};

export const route: Route = {
    path: '/gov/tj/:category?',
    categories: ['government'],
    example: '/gov/tianjin/zwgk_143/',
    parameters: {
        category: {
            name: '政务公开',
            description: '可从URL路径获取，默认为最新政策',
            options: Object.keys(categoryMap),
            default: 'zwgk_143'
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
            source: ['ghzrzy.tj.gov.cn/:category*/'],
            target: (params) => {
                const category = params.category || 'zwgk_143';
                return `/tianjin/${category}`;
            }
        }
    ],
    name: '政策法规',
    maintainers: ['RSSHub-Bot'],
    handler: async (ctx) => {
        const { category = 'zwgk_143' } = ctx.req.param();
        const baseUrl = 'http://ghzrzy.tj.gov.cn';
        const listUrl = `${baseUrl}/${category}/`;
        
        // 步骤1: 获取政策列表页
        const response = await ofetch(listUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
            }
        });
        
        const $ = load(response);
        const categoryName = categoryMap[category] || '最新政策';
        
        // 步骤2: 解析分页信息
        const pageInfo = $('.pagination');
        const totalPages = pageInfo.length 
            ? parseInt(pageInfo.find('li:last-child').prev().text() || '1') 
            : 1;
        
        // 步骤3: 解析政策列表
        const listItems = $('.news-list li').toArray();
        
        // 步骤4: 处理每个政策项
        const items = await Promise.all(
            listItems.map((item) => {
                const $item = $(item);
                const titleElement = $item.find('a').first();
                const title = titleElement.text().trim();
                const relativeUrl = titleElement.attr('href');
                const link = new URL(relativeUrl, baseUrl).href;
                const pubDate = parseDate($item.find('.date').text().trim(), 'YYYY-MM-DD');
                
                // 步骤5: 获取政策详情（使用缓存）
                return cache.tryGet(link, async () => {
                    try {
                        // 步骤6: 请求政策详情页
                        const detailResponse = await ofetch(link, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
                            }
                        });
                        
                        const $detail = load(detailResponse);
                        
                        // 步骤7: 解析政策元数据
                        const metaData = {};
                        $detail('.file-info li').each((i, el) => {
                            const text = $(el).text().trim();
                            const [key, ...valueParts] = text.split('：');
                            if (key && valueParts.length) {
                                metaData[key] = valueParts.join('：').trim();
                            }
                        });
                        
                        // 步骤8: 解析政策正文
                        let content = $detail('.article-content').html() || $detail('.TRS_Editor').html();
                        
                        // 步骤9: 构建完整描述
                        let description = `<h2>${title}</h2>`;
                        
                        // 添加元数据
                        description += `<div class="file-meta"><ul>`;
                        for (const [key, value] of Object.entries(metaData)) {
                            description += `<li><strong>${key}：</strong>${value}</li>`;
                        }
                        description += `</ul></div>`;
                        
                        // 添加正文内容
                        if (content) {
                            description += content;
                        } else {
                            description += `<p>政策内容详情请访问<a href="${link}">官方网站</a>查看</p>`;
                        }
                        
                        // 步骤10: 返回完整政策项
                        return {
                            title,
                            link,
                            pubDate,
                            description,
                            category: Object.keys(metaData),
                            author: metaData['发布机构'] || '天津市规划和自然资源局'
                        };
                    } catch (error) {
                        console.error(`Failed to fetch policy detail: ${link}`, error);
                        return {
                            title,
                            link,
                            pubDate,
                            description: `<p>获取政策详情失败，请<a href="${link}">访问官网查看</a></p>`
                        };
                    }
                });
            })
        );
        
        // 步骤11: 返回RSS结果
        return {
            title: `天津市规划和自然资源局 - ${categoryName}`,
            link: listUrl,
            item: items,
            description: `天津市规划和自然资源局${categoryName}栏目最新政策文件`,
            language: 'zh-cn',
            // 添加分页元数据
            meta: {
                currentPage: 1,
                totalPages,
                nextPage: totalPages > 1 ? `${listUrl}index_1.html` : null
            }
        };
    },
};