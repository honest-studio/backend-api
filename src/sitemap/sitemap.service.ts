import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as sm from 'sitemap';
import { MongoDbService, MysqlService } from '../feature-modules/database';
import { SitemapPack } from '../types/article-helpers';
var colors = require('colors');

const SITEMAP_ROOT_DIR = path.join(__dirname, '..', '..', 'public', 'sitemaps');
const ROW_LIMIT = 50000;
const RECENT_ROW_LIMIT = 1000;

export const getLangPrefix = (lang: string) => {
    let langPrefix = '';
    switch(lang){
        case 'en':
            langPrefix = '';
            break;
        case 'zh-hans':
            langPrefix = 'zh.';
            break;
        default:
            langPrefix = `${lang}.`;
    };
    return langPrefix;
}

@Injectable()
export class SitemapService {
    constructor(
        private mongo: MongoDbService,
        private mysql: MysqlService
    ) {}

    async getSitemapRecent(res: Response, lang: string = 'en', limit: number = 1000): Promise<any> {
        let find_query;
        let today = new Date();
        let start_from = new Date().setDate(today.getDate() - 180) / 1000;

        let sitemapPacks: any[] = await this.mysql.TryQuery(
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
                AND lastmod_timestamp >= FROM_UNIXTIME(?)
            ORDER BY lastmod_timestamp DESC
            LIMIT ?
            `,
            [lang, start_from, RECENT_ROW_LIMIT],
            3600000 // 1 hr timeout
        );


        let urlPacks = [];
        sitemapPacks.forEach((result) => {
            urlPacks.push({ 
                url: `/wiki/lang_${result.lang}/${result.slug}`
            });
        });

        let langPrefix = getLangPrefix(lang);
        let theMap = sm.createSitemap({
            hostname: `https://${langPrefix}everipedia.org`,
            cacheTime: 600000, // 600 sec - cache purge period
            urls: urlPacks
        });

        let xml_sitemap = theMap.toXML();

        res
            .header('Content-Type', 'application/xml')
            .status(200)
            .send(xml_sitemap);

        return true;
    }

    async generateStaticSitemaps(lang: string = 'en'): Promise<any> {

        // To prevent DDOS attacks
        return null;

        // curl -m 600 http://127.0.0.1:3001/v2/sitemap/generate-static/en 

        let sitemapPacks: Array<SitemapPack> = [];
        let currentLoop = 0, lastID = 0;
        let sitemapURLs = [];
        let langPrefix = getLangPrefix(lang);
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
                    changefreq: 'monthly'
                };
            });
    
            let sitemap = sm.createSitemap({
                hostname: hostName,
                cacheTime: 600000, // 600 sec - cache purge period
                urls: urlPacks as any
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

    async serveStaticSitemap(res: Response, lang: string = 'en', filename: string): Promise<any> {
        let sitemapDirectory = path.join(SITEMAP_ROOT_DIR, lang);
        let read_file: string = fs.readFileSync(path.join(sitemapDirectory, filename), { encoding: 'utf-8' });

        res
            .header('Content-Type', 'application/xml')
            .status(200)
            .send(read_file);

        return true;

    }

    async getCategoriesSitemap(res: Response, lang: string = 'en'): Promise<any> {
        let sitemapPacks: any[] = await this.mysql.TryQuery(
            `
            SELECT 
                lang, 
                slug
            FROM 
                enterlink_pagecategory 
            WHERE lang = ?
            `,
            [lang],
            3600000 // 1 hr timeout
        );


        let urlPacks = [];
        sitemapPacks.forEach((result) => {
            urlPacks.push({ 
                url: `/category/lang_${result.lang}/${result.slug}`
            });
        });

        let langPrefix = getLangPrefix(lang);
        let theMap = sm.createSitemap({
            hostname: `https://${langPrefix}everipedia.org`,
            cacheTime: 600000, // 600 sec - cache purge period
            urls: urlPacks
        });

        let xml_sitemap = theMap.toXML();

        res
            .header('Content-Type', 'application/xml')
            .status(200)
            .send(xml_sitemap);

        return true;
    }

}
