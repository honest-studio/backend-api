import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as sm from 'sitemap';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { SitemapPack } from '../utils/article-utils/';
var colors = require('colors');

const SITEMAP_ROOT_DIR = path.join(__dirname, '..', '..', 'public', 'sitemaps');

@Injectable()
export class SitemapService {
    constructor(
        private mongo: MongoDbService,
        private mysql: MysqlService
    ) {}

    async getSitemapRecent(res: Response, lang: string = 'en', limit: number = 1000): Promise<any> {
        let find_query;
        const now = (Date.now() / 1000) | 0;

        find_query = {
            'trace.act.account': 'eparticlectr',
            'trace.act.name': 'logpropinfo',
            'trace.act.data.lang_code': lang,
            'trace.act.data.endtime': { $lt: now }
        };
        
        const approved_edits = await this.mongo
            .connection()
            .actions.find(find_query, { projection: { 
                'trace.act.data.proposal_id': 1, 
                'trace.act.data.slug': '',
                'trace.act.data.page_lang': '' } 
            })
            .sort({ 'trace.act.data.proposal_id': -1 })
            .limit(limit)
            .toArray();

        let seenSlugs = [], urlPacks = [];
        approved_edits
            .forEach((doc) => {
                let theSlug = doc.trace.act.data.slug;
                if (seenSlugs.indexOf(theSlug) == -1){
                    urlPacks.push({ 
                        url: `/wiki/lang_${lang}/${theSlug}`,
                        changefreq: 'daily',
                        priority: 1
                    });
                    seenSlugs.push(theSlug);
                }
            });

        let langPrefix = lang == 'en' ? '' : `${lang}.`;
        let theMap = sm.createSitemap({
            hostname: `https://${langPrefix}everipedia.org`,
            cacheTime: 600000, // 600 sec - cache purge period
            urls: urlPacks
        });

        theMap.toXML( function(err, xml){ 
            if (err){ 
                console.log(err) 
            }
            else{
                res.header('Content-Type', 'application/xml');
                res.send(xml);
            }
        });

        return theMap.toString();
    }

    async generateStaticSitemaps(lang: string = 'en'): Promise<any> {
        const ROW_LIMIT = 50000;
        let sitemapPacks: Array<SitemapPack> = [];
        let currentLoop = 0, lastID = 0;
        let sitemapURLs = [];
        let langPrefix = lang == 'en' ? '' : `${lang}.`;
        let hostName = `https://${langPrefix}everipedia.org`;
        let sitemapDirectory = path.join(SITEMAP_ROOT_DIR, lang);
        if (!fs.existsSync(sitemapDirectory)){
            fs.mkdirSync(sitemapDirectory);
        }
        console.log(colors.green(`Generating static sitemaps for ${lang}`));
        while (currentLoop == 0 || sitemapPacks.length){
            sitemapPacks = await this.mysql.TryQuery(
                `
                SELECT 
                    id, 
                    page_lang AS lang, 
                    slug
                FROM 
                    enterlink_articletable art 
                WHERE 
                    art.is_removed = 0
                    AND art.is_indexed = 1
                    AND redirect_page_id IS NULL
                    AND art.page_lang = ?
                    AND art.id > ?
                LIMIT ?
                `,
                [lang, lastID, ROW_LIMIT],
                3600000 // 1 hr timeout
            );

            if (!sitemapPacks.length) break;

            // console.log(sitemapPacks);
            let foundNextLastID = false;
            let backcount = 1;
            while (!foundNextLastID){
                if(sitemapPacks[ROW_LIMIT - backcount]){
                    let firstID = sitemapPacks[0].id;
                    lastID = sitemapPacks[ROW_LIMIT - backcount].id;
                    foundNextLastID = true;
                    console.log(colors.green(`Processing ${lang} static sitemap ${firstID}-${lastID}`));
                }
                else{
                    backcount++;
                }
            }

            let urlPacks = sitemapPacks.map((pack) => {
                return { 
                    url: `/wiki/lang_${pack.lang}/${pack.slug}`,
                    changefreq: 'monthly',
                    priority: 0.3
                };
            });
    
            let sitemap = sm.createSitemap({
                hostname: hostName,
                cacheTime: 600000, // 600 sec - cache purge period
                urls: urlPacks
            });
    
            let fileName = `${lang}-${currentLoop}.xml`;
            sitemapURLs.push(`${hostName}/sitemaps/${lang}/${fileName}`)
            fs.writeFileSync(path.join(sitemapDirectory, fileName), sitemap.toString());
            currentLoop += 1;
        }
        let sitemapIndex = sm.buildSitemapIndex({
            urls: sitemapURLs
        });
        let indexFileName = `${lang}-index.xml`;
        fs.writeFileSync(path.join(sitemapDirectory, indexFileName), sitemapIndex.toString());
        console.log(colors.green(`Static sitemap for ${lang} completed`));
    }
}
