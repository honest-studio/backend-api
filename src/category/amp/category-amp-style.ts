export const styleNugget = `<style amp-custom>

body, html{
	width: 100%;
	text-align: center;
	background-color: #fefefe;
	float: left;
	position:relative;
	top:0px;
	font-family: 'Libre Baskerville',serif;
}
main{
	float: left;
	width: 100%;
	position: relative;
	z-index: 15;
	display: block;
	margin-top: 53px;
}
article.schema-wrap{
	display: block;
	width: 100%;
	position: relative;
}
a{
	color: #2273DD;
	text-decoration: none;
}
a:visited{
	color: #2273DD;
}
span.tt-wrap{
	color: #71b8e4;
}
img{
	max-width: 100vw;
}
.h1, .h2, .h3, .h4, .h5, .h6, h1, h2, h3, h4, h5, h6 {
	font-weight:400;
}
amp-accordion, .toc-button, button, a{
	-webkit-tap-highlight-color: rgba(0,0,0,0);
}

#footer a{
	float: left;
	width: 100%;
	padding: 5px;
	font-size: 14px;
}
.social-logo{
	top: 5px;
	position: relative;
	padding: 5px 10px 5px 10px;
}
.search-lb-ct {
	background-color: rgba(0,0,0,.70);
	min-height: 700px;
}
.search-lb-ct .global-search {
	height: 75vh;
	width: 100vw;
	display: flex;
	flex: 1;
	background: transparent;
	border-radius: 2px;
	box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.08);
	transition: box-shadow 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
	position: relative;
	margin-left: auto;
	margin-right: auto;
}
.search-lb-ct .amp-iframe {
	height: 75vh;
}
.search-toggle-space-bottom {
	min-height:25vh;
	background:rgba(255, 167, 0, 0.0);
}
#search-form-amp{
	height: 47px;
}
#search-form-amp fieldset{
	border: none;
	padding: 0px;
	margin: 0px;
}
.amp-header-bar {
	position: fixed;
	background-color: white;
	z-index: 20;
	width: 100%;
	height: 52px;
	border-bottom: 1px solid #e9e9e9;
	top: 0;
}
.amp-nav-bar {
	position: fixed;
	background-color: #2D2D2D;
	z-index: 20;
	width: calc(100% - 40px);
	top: 52px;
	color: white;
	display: -webkit-box;
	display: -webkit-flex;
	display: -ms-flexbox;
	display: flex;
	-webkit-box-pack: center;
	-webkit-justify-content: center;
	-ms-flex-pack: center;
	justify-content: center;
	-webkit-align-items: center;
	-webkit-box-align: center;
	-ms-flex-align: center;
	align-items: center;
	padding: 10px 20px 5px 20px
}
.amp-nav-bar .nav-container {
	width: 100%;
	display: -webkit-box;
	display: -webkit-flex;
	display: -ms-flexbox;
	display: flex;
	-webkit-box-pack: justify;
	-webkit-justify-content: space-between;
	-ms-flex-pack: justify;
	justify-content: space-between;
}
.amp-nav-bar .nav-item {
	display: -webkit-box;
	display: -webkit-flex;
	display: -ms-flexbox;
	display: flex;
	-webkit-flex-direction: row;
	-ms-flex-direction: row;
	flex-direction: row;
	-webkit-box-pack: start;
	-webkit-justify-content: flex-start;
	-ms-flex-pack: start;
	justify-content: flex-start;
	-webkit-align-items: stretch;
	-webkit-box-align: stretch;
	-ms-flex-align: stretch;
	align-items: stretch;
	-webkit-flex-wrap: auto;
	-ms-flex-wrap: auto;
	flex-wrap: auto;
	margin: initial;
	height: initial;
	width: initial;
	-webkit-align-items: center;
	-webkit-box-align: center;
	-ms-flex-align: center;
	align-items: center;
	cursor: pointer;
	opacity: 1;
}
.amp-nav-bar .nav-item .nav-text {
	font-family: 'Open Sans',sans-serif;
	font-size: 11px;
	text-align: center;
	font-style: normal;
	color: #FFFFFF;
	margin: 0px;
	max-height: none;
	overflow: visible;
	text-overflow: auto;
	opacity: 1;
	top: -8px;
	position: relative;
}
.amp-header-bar ul {
	list-style-type:none;
	width:100%;
	padding:0px;
	height:20px;
}
.amp-header-menu li {
	padding:0px;
}
.amp-header-menu {
	float:right;
	margin-top:-4px;
	margin-right:10px;
}
.amp-header-menu button {
	border:0px;
	background:transparent;
	padding-left: 2px;
	padding-right: 2px;
}
.amp-header-menu .avatar-menu amp-img {
	width: 26px;
	border-radius: 35px;
	margin-top: -0px;
	object-fit: cover;
	height: 26px;
}
.amp-header-menu .bull-menu amp-img {
	width: 7px;
	margin-top: 0px;
	object-fit: cover;
	height: 26px;
	margin-right: 5px;
	margin-left: 5px;
}
.amp-header-toc {
	position: absolute;
	margin-top:-2.5px;
	margin-left: 5px;
	z-index: 11;
}
.amp-header-toc button {
	border:0px;
	opacity:0.7;
	background:transparent;
}
.amp-header-toc img {
	width: 30px;
	height:auto;
}
.toc-span-fix{
	float:left;
	margin-top:-50px;
	display: block;
}
.amp-header-logo {
	position: absolute;
	left: 0;
	right: 0;
	margin-left: auto;
	margin-right: auto;
	width: 100%;
	top: 10px;
}
.amp-header-logo a {
	display: inline-block;
}
.amp-header-search {
	float:right;
	margin-right: 5px;
	margin-top: -5px;
}
.amp-header-search button {
	border:0px;
	background: transparent;
	margin: 0px;
	padding: 0px;
}
.amp-header-search .svgIcon {
	opacity:0.7;
	cursor: pointer;
}
#amp-header-bar{
	position: fixed;
	background-color: white;
	z-index: 5;
	width: 100%;
}
#amp-header-spacer{
	height:88px;
}
#amp_share_container{
	border-bottom: 1px solid rgba(128, 128, 128, 0.21);
	height: 45px;
}
#amp_share_text{
	margin-bottom: 14px;
	vertical-align: bottom;
	line-height: 11px;
	display: inline-block;
	color: #2273DD;
	font-weight: normal;
}
#usermenu-lightbox .lb-button, #usermenu-lightbox .lb-button {
	position: absolute;
	z-index: 9999;
	right: 8px;
	top: 8px;
}
#usermenu-lightbox .lightbox, #usermenu-lightbox .lightbox {
	width:100%;
	min-height: 700px;
	background: rgba(0, 0, 0, 0.80);
	z-index: 8888;
}
.usermenu-toggle-space {
	float:left;
	width:25%;
	min-height:700px;
}
.usr-mnu {
	background: #FFF;
	min-height: 700px;
	float: right;
	width: 75%;
	font-family: 'OpenSans','Open Sans',sans-serif;
	z-index: 9999;
}
.usr-mnu-hdr {
	background: #fafafa;
	height: 48px;
	border-bottom: 1px solid #EFEFEF;
}
.usr-mnu-hdr .loggedin-default {
	line-height: 41px;
	font-size: 17px;
	text-align: center;
	float: left;
	margin-top: 3px;
	color: #555;
	width: 100%;
	padding-left:3px;
}
.usr-mnu-hdr .loggedin-info{
	font-size: 15px;
	float: left;
	height: 100%;
	width: 100%;
}
.usr-mnu-hdr .img-circle.loggedin-userphoto{
	display: inline-block;
	width: 38px;
	height: 38px;
	margin: 4px 11px 5px 16px;
	vertical-align: baseline;
	float: left;
	border-radius: 25px;
}
.usr-mnu-hdr .loggedin-grp {
	display: inline-block;
	font-size: 14px;
	line-height: 20px;
	float: left;
	margin-top: 3px;
	color: #555;
}
.usr-mnu-hdr .loggedin-plainname {
	text-align: left;
	/*padding: 0px 0px 3px 0px;
	*/
}
.usr-mnu-hdr .loggedin-username {
	text-align: left;
	/*padding: 0px 0px 3px 0px;
	*/
}
.usr-mnu-hdr .loggedin-scatter-only{
	line-height: 41px;
	font-size: 17px;
}
.usr-mnu-hdr a {
	color: #555;
	width: 90%;
	float: left;
}
.usr-mnu-hdr amp-img {
	float:left;
	border-radius: 100%;
	border: 1px solid #efefef;
}
.usr-mnu-hdr h2 {
	float: left;
	margin: 0px;
	margin-left: 14px;
	margin-top: 8px;
	font-family: 'OpenSans','Open Sans',sans-serif;
	font-weight: normal;
	font-size: 15px;
}
.usr-mnu ul {
	list-style-type: none;
	padding: 0px;
	margin-top: 0px;
	float: left;
	width: 100%;
}
.usr-mnu li {
	padding: 13px 0px 13px 22px;
	border-bottom: 1px solid #efefef;
	text-align: left;
	float: left;
	width: 100%;
}
.usr-mnu li span:not(.lang-flag-container) {
	float: left;
	margin-right: 22px;
	color: #555;
	font-size: 21px;
	width: 15px;
	margin-top: 0px;
}
.usr-mnu li a {
	color: #555;
	font-size: 17px;
	line-height: 26px;
}
.usr-mnu .line-text{
	line-height: 25px;
	position: relative;
}
.usr-mnu .line-logo {
	width: 25px;
	height: 25px;
	float: left;
	margin-right: 15px;
}
.rowParent, .columnParent{
	display: -webkit-box;
	display: -ms-flexbox;
	display: -webkit-flex;
	display: flex;
	-webkit-box-direction: normal;
	-webkit-box-orient: horizontal;
	-webkit-flex-direction: row;
	-ms-flex-direction: row;
	flex-direction: row;
	-webkit-flex-wrap: nowrap;
	-ms-flex-wrap: nowrap;
	flex-wrap: nowrap;
	-webkit-box-pack: start;
	-webkit-justify-content: flex-start;
	-ms-flex-pack: start;
	justify-content: flex-start;
	-webkit-align-content: stretch;
	-ms-flex-line-pack: stretch;
	align-content: stretch;
	-webkit-box-align: stretch;
	-webkit-align-items: stretch;
	-ms-flex-align: stretch;
	align-items: stretch;
}
.columnParent{
	-webkit-box-orient: vertical;
	-webkit-flex-direction: column;
	-ms-flex-direction: column;
	flex-direction: column;
}
.flexChild{
	-webkit-box-flex: 1;
	-webkit-flex: 1;
	-ms-flex: 1;
	flex: 1;
	-webkit-align-self: auto;
	-ms-flex-item-align: auto;
	align-self: auto;
}
#amp_submit_search{
	-webkit-box-flex: 0;
	-webkit-flex: 0 0 auto;
	-ms-flex: 0 0 auto;
	flex: 0 0 auto;
	width: 40px;
}
amp-social-share{
	float: left;
}
#amp_submit_search input{
	border: 0;
	width: 35px;
	font-size: 25px;
	line-height: 46px;
	height: 47px;
	background: #ffffff;
	cursor: pointer;
	border-radius: 0px;
	padding: 0px;
	-webkit-appearance: button;
}
#amp_input_search #AJAXBox{
	width: 100%;
	border: 0px;
	height: 47px;
	padding: 0px 0px 0px 0px;
	font-size: 13px;
	font-weight: 400;
}
#amp_logo_search{
	-webkit-box-flex: 0;
	-webkit-flex: 0 0 auto;
	-ms-flex: 0 0 auto;
	flex: 0 0 auto;
	width: 40px;
	margin: 5px;
	margin-bottom: 0px;
}
amp-sidebar{
	background: #4C4C4C;
	color: #EFEFEF;
	border-right: 1px solid #4C4C4C;
	font-family: 'OpenSans','Open Sans',sans-serif;
}
amp-sidebar .toc-header {
	width: 90%;
	text-align: left;
	font-size: 0.9em;
	font-weight: 400;
	padding-left: 20px;
	text-transform: uppercase;
	padding-top: 20px;
	padding-bottom: 16px;
}
amp-sidebar .hdr-clct li{
	border-bottom: 1px solid #666;
	border-top: 1px solid #666;
}
amp-sidebar .toc-header-h2{
	padding: 5px 5px 5px 0px;
}
amp-sidebar .toc-header-h2 a .fixed-items-description {
	line-height: 20px;
}
amp-sidebar li.toc-header-h3{
	border:0 solid transparent;
	padding-left: 20px;
	width: calc(100% - 20px);
	margin-top: -5px;
	padding-bottom: 5px;
}
amp-sidebar li.toc-header-h3 a:before{
	content: "-";
	text-indent: -5px;
	padding-left: 10px;
	padding-right: 10px;
	color: #CCC;
	font-size: 20px;
	float: left;
	line-height: 19px;
}
amp-sidebar .toc-header-h3 a .fixed-items-description {
	font-size: 13px;
	background: transparent;
	color: #CCC;
	padding-left: 0px;
	display: inline-block;
	width: calc(100% - 35px);
	line-height: 18px;
}
amp-sidebar li.toc-header-h4{
	border-bottom:0px;
	border-top:0px;
	float: left;
	margin-top: -5px;
	padding: 3px;
}
amp-sidebar li.toc-header-h4 a {
	font-size: 13px;
	background: transparent;
	padding: 2px 0px 2px 40px;
	color: #CCC;
	width: calc(100% - 15px);
}
amp-sidebar li.toc-header-h4 a:before{
	content: "•";
	text-indent: -5px;
	padding-left: 10px;
	padding-right: 5px;
	color: #CCC;
	line-height: 17px;
	font-size: 15px;
	float: left;
}
amp-sidebar .toc-header-h4 a .fixed-items-description {
	float: left;
	display: inline-block;
	color: #CCC;
	padding-left: 0;
	line-height: 16px;
	font-size: 12px;
	width: calc(100% - 55px);
}
amp-lightbox .lb-button {
	float:right;
	margin-right: 5px;
	cursor:pointer;
	margin-top: 10px;
	margin-bottom: -15px;
}
amp-lightbox .lb-button button, amp-sidebar .lb-button button, #pg-opts .lb-button button{
	border: none;
	color: #333;
	padding: 0px;
	line-height: 21px;
	text-align: center;
	background-color: transparent;
	text-decoration: none;
	display: inline-block;
	font-size: 25px;
	cursor: pointer;
}
amp-sidebar .toc-button {
	float:right;
	margin-right: 5px;
	cursor:pointer;
}
amp-sidebar .toc-button button, amp-sidebar .toc-button button, #pg-opts .toc-button button{
	border: none;
	color: #333;
	padding: 0px;
	line-height: 21px;
	text-align: center;
	background-color: transparent;
	text-decoration: none;
	display: inline-block;
	font-size: 25px;
	margin-top: -4px;
	cursor: pointer;
}

.hdr-clct > li{
	display: block;
	float: left;
	width: 100%;
	text-align: left;
}
.hdr-clct > li a{
	width:100%;
	display: block;
	text-decoration: none;
}
.hdr-clct > li .icon{
	flex-grow: 1;
	font-size: 25px;
	width: 37px;
	float: left;
	margin: 5px 0px 0px 10px;
	display: block;
	flex-shrink: 1;
	display:none;
}
.hdr-clct > li .fixed-items-description{
	padding-top: 3px;
	display: block;
	font-size: 17px;
	color: #EFEFEF;
	padding-left: 20px;
	line-height: 36px;
	padding-bottom:3px;
}
.hdr-clct > li:first-child .fixed-items-description{
	font-size: 20px;
	font-weight: bold;
}
.hdr-clct > li:not(:last-child){
	border-bottom: 0px solid #ededed;
}
.icon:before{
	top: 2px;
	display: inline-block;
	speak: none;
	font-size: 100%;
	font-style: normal;
	font-weight: 400;
	font-variant: normal;
	text-transform: none;
	line-height: 1;
	-webkit-font-smoothing: antialiased
}
:focus{
	outline: none;
}
.category-container, .category-container .category-list {
	float: left;
    width: 100%;
}
.category-container .category-list {
	padding: 0px 10px;
}
.cat-hdr {
	float: left;
    width: 100%;
    text-align: center;
    margin-top: 15px;
    font-size: 20px;
}
.cat-ancr-wrp{
	float: left;
	width: calc(100% - 20px);
	padding: 0;
	background: #fbfbfb;
	margin: 0px 0px 15px 0px;
	border: 1px solid rgba(0,0,0,0.1);
	border-radius: 2px 2px 0 0;
}
.cat-ancr-wrp:last-child {
	border-bottom:1px solid rgba(0,0,0,0.1);
	margin-bottom: 10px;
}
.cat-ancr-wrp .seealso-spacer{
	margin: 10px 0px;
	float: left;
	width: 100%;
	border-bottom: 1px solid #e6e6e6;
}
.cat-ancr-wrp amp-img{
	float: left;
	margin-right: 10px;
}
.cat-ancr-wrp amp-anim{
	float: left;
	margin-right: 10px;
}
.cat-ancr-wrp img{
	object-fit: cover;
	float:left;
}
.cat-ancr-wrp .cat-contentwrap {
	height: 80px;
    font-family: OpenSans,'Open Sans',sans-serif;
    float: left;
    width: calc(100% - 65px);
    margin-top: 5px;
}
.cat-ancr-wrp .cat-title{
	color:#222222;
	text-align: left;
	position: relative;
	float: left;
	font-family: inherit;
	font-size: 1em;
	max-height: 2.6em;
	line-height: 1.3;
	margin: 0;
	overflow: hidden;
	padding: 0;
	position: relative;
	font-weight: 500;
	width:100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.cat-ancr-wrp .cat-blurb {
    float: left;
    width: 100%;
    color: #636363;
    font-size: .8em;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
    text-align: left;
    max-height: 55px;
}
.cat-ancr-wrp .cat-blurb p {
	margin: 3px 0px;
}
.cat-ancr-wrp .cat-noimg {
	background:url("https://epcdn-vz.azureedge.net/static/images/no-image-slide.png");
	background-size: cover;
	height: 80px;
	width: 80px;
	float: left;
	margin-right: 15px;
	border-right: 1px solid rgba(0,0,0,0.1);
}
.ftr {
    width: calc(100% - 20px);
    padding: 0px 10px 0px 10px;
    margin-left: 0px;
    margin-right: 0px;
    margin-top: 20px;
	background: auto;
	float: left;
	font-family: 'OpenSans','Open Sans',sans-serif;
}
.ftr .footer-wrapper {
	border-top: 1px solid lightgray;
    border-bottom: 1px solid lightgray;
	padding: 15px 0px 15px 0px;
	margin-bottom: 15px;
}
.ftr .copyright {
	color: #666;
	font-size: 14px;
	font-family: 'OpenSans','Open Sans',sans-serif;
}
.ftr .cayman-flag-footer {
	position: relative;
	top: 6px;
	left: 2px;
}
.ftr .footer-separator {
	width:74%;
	border-bottom: 1px solid #c6c2c4;
	margin-left: auto;
	margin-right: auto;
}
.ftr .copyright .disclaimer {
	width: auto;
	display: block;
	text-align: center;
	font-size: 14px;
	margin-top: 7px;
	font-style: normal;
}
.ftr .copyright .disclaimer a {
	font-size: 14px;
	color: #2273DD;
	margin-right: 0px;
}
.ftr .copyright .cc-img {
	position: relative;
	top: 3px;
}
.ftr .footer-links {
	color: #666;
	font-size: 14px;
	font-family: 'OpenSans','Open Sans',sans-serif;
	padding: 20px 10px 20px 10px;
	margin-left:auto;
	margin-right:auto;
	width: 85%;
	line-height: 24px;
}
.ftr a, .ftr .footer-span-link {
	color: #666;
	display: inline-block;
	margin-right: 10px;
	font-size: 15px;
	font-family: 'OpenSans','Open Sans',sans-serif;
	line-height: 20px;
	padding: 10px 10px 10px 10px;
}
.ftr .footer-span-terms-of-use {
	color: #2273DD;
}
.ftr .footer-social, .ftr .eos-powered-line {
	padding-bottom: 30px;
	font-size: 14px;
	color: #666;
}
.ftr .eos-powered-line .pwr-join-txt {
	position: relative;
    top: -8px;
}
.ftr .footer-social{
	padding-bottom: 19px;
}
.ftr .eos-powered-line a{
	margin-right: 0px;
}
.ftr .eos-powered-line > a.eos-link{
	border-right: 1px solid #666;
	padding-right: 5px;
	margin-right: 8px;
}
.ftr .eos-powered-line .liberty-footer-img {
	width: 50px;
	height: 40px;
	position: relative;
	top: 8px;
	left: -3px;
}
.ftr .eos-powered-line .scatter-footer-img {
	position: relative;
	top: 5px;
	left: -2px;
}
.ftr .eos-powered-line #powered-by-eos, .ftr .eos-powered-line #api-by-libertyblock, .ftr .eos-powered-line #api-by-scatter{
	position: relative;
	top: -8px;
	right: 2px;
}
.ftr img.eos-footer-img, .ftr img.eos-footer-img {
	border-radius: 3px;
	margin-left: 3px;
}
.ftr .app-footer-container{
	margin-top: 20px;
	opacity:0.9;
}
.bitcoin-footer-logo{
	width: 20px;
	height: 20px;
	margin-right: 2px;
	margin-left: 0px;
	position: relative;
	top: 5px;
}
h5 > .icon{
	font-size: 19px;
	display: inline-grid;
	top: 2px;
	margin-right: 1px;
	position: relative;
}
.genius-avatar {
	border-radius:35px;
	display:block;
	float:left;
	width:30px;
	height:30px;
	position:relative;
	margin-left:2px;
}
.share-ct, .te-ct, .lang-ct {
	background: white;
	min-height: 725px;
	width: 85%;
}
#share-lightbox .lb-button.cls-shr-lgbx, #toped-ltbx .lb-button.close-toped-ltbx, #language-lightbox .lb-button.cls-lang-lgbx{
	height:100%;
	width: 15%;
	margin: 0px;
}
#share-lightbox .lb-button.cls-shr-lgbx button, #toped-ltbx .lb-button.close-toped-ltbx button, #language-lightbox .lb-button.cls-lang-lgbx button{
	height:100%;
	width: 100%;
	float: left;
	display: block;
}
.social-share-block-wrap{
	float: left;
	width: 100%;
	text-align: center;
}
.social-share-block-wrap .social-share-block{
	text-align: center;
	display: inline-block;
}
.share-ct-inner {
	padding-top: 1px;
	width:85%;
	margin-left: auto;
	margin-right: auto;
}
.share-ct-inner h2 {
	font-size: 17px;
	font-family: 'OpenSans','Open Sans',sans-serif;
	font-weight: normal;
	text-transform: uppercase;
	color: #272727;
	margin-bottom: 15px;
}
.share-ct-inner amp-social-share {
	margin-right: 4px;
	border-radius: 4px;
	margin-bottom: 10px;
	margin-left: 4px;
}
.share-ct-link{
	font-family: 'OpenSans','Open Sans',sans-serif;
	width: calc(100% - 40px);
	float: left;
	padding: 10px 20px;
	overflow-x: hidden;
	white-space: normal;
	word-break: break-all;
	word-wrap: normal;
	text-align: center;
	display: block;
}
.share-ct-link h4{
	margin: 0px 0px 15px 0px;
	text-align: center;
}
.share-ct-link.qr-code-container{
	text-align: center;
	cursor: pointer;
}
.share-ct-link.qr-code-container h4{
	margin-bottom: 0px;
}
.share-ct-link .suggested-tags{
	font-size: 17px;
	font-family: 'OpenSans','Open Sans',sans-serif;
	font-weight: normal;
	text-transform: uppercase;
	color: #272727;
	margin-bottom: 35px;
}
.share-ct .share-hshtgs{
	font-family: 'OpenSans','Open Sans',sans-serif;
	margin: 0 20px;
	width: calc(100% - 40px);
	float: left;
	display: block;
}
.share-ct .share-hshtgs .suggested-tags{
	float: left;
	text-align: center;
	width: 100%;
	margin-top: 10px;
	margin-bottom: 5px;
	font-weight: 400;
	text-transform: uppercase;
}
.share-ct .share-hshtgs ul.tag-list{
	list-style: none;
	font-size: 13px;
	margin: 5px 0px 5px 0px;
	display: inline-grid;
	text-align: center;
	padding: 0;
}
.share-ct .share-hshtgs ul.tag-list li{
	float: left;
	display: block;
	width: 100%;
	text-align: left;
	margin: 3px 0px;
}
.share-ct .share-pad{
	margin: 10px 30px;
	border-bottom: 1px solid #d9d9d9;
	width: calc(100% - 60px);
	float: left;
}
.lang-ct h2{
	background: white;
	float: left;
	text-align: center;
	width: 100%;
	text-transform: uppercase;
	font-family: 'OpenSans','Open Sans',sans-serif;
}
.lang-ct ul{
	list-style: none;
	float: left;
	width: 100%;
	text-align: left;
	margin: 0px;
}
.lang-ct li{
	list-style: none;
	float: left;
	width: 100%;
	padding: 5px 0px;
}
.lang-ct a{
	float: left;
}
.lang-ct .mini-lang-title{
	position: relative;
	font-family: 'OpenSans','Open Sans',sans-serif;
	top: -10px;
	left: 10px;
	font-size: 18px;
}
.gif-pixel-fix{
	display: inline;
}
.share-ct .share-ct-inner a.social-share-btn{
	margin-right: 4px;
	border-radius: 4px;
	margin-bottom: 10px;
	margin-left: 4px;
	float: left;
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
	text-decoration: none;
	cursor: pointer;
	width: 50px;
	height: 44px;
}
.share-ct .share-ct-inner a.email {
	background-color: black;
	background-image: url('data:image/svg+xml;
	charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M101.3%20141.6v228.9h0.3%20308.4%200.8V141.6H101.3zM375.7%20167.8l-119.7%2091.5%20-119.6-91.5H375.7zM127.6%20194.1l64.1%2049.1%20-64.1%2064.1V194.1zM127.8%20344.2l84.9-84.9%2043.2%2033.1%2043-32.9%2084.7%2084.7L127.8%20344.2%20127.8%20344.2zM384.4%20307.8l-64.4-64.4%2064.4-49.3V307.8z%22%2F%3E%3C%2Fsvg%3E');
}
.share-ct .share-ct-inner a.facebook {
	background-color: #4a6ea9;
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7DAAAOwwHHb6hkAAABeElEQVRYhWP0zF35j5GRgZFhIMD///+ZBsxyBgYGBkZGRqYBsxwKBtwBLJRolhDmZvC3V2XQVxNnEObnZGBkZGD4/ecfw7X7bxha5x6jrQOs9aUZimMtGNhZmTHkhPg4iDaHLAdIinAzlMRaMLBhsZyBgYHh9+9/tHWAj60qhuV///1j+PHzDwMDAwPDt5+/aesADQUhFP75my8YmuccZfj56y/JZpGVC9hZUd199voLsiwn2wHo4N+//2TrHTrlgKaCMAMXJysDAwMDAxcHqjZZcT4GY00JOP/bj98M1++/JcpcRq+8lUSF3+RSVwYlGUGiDL3z+B1Dfs8eotTSJAq+/fhDtFqaOABWHhADiE4Dtx69Z/jyHVLAqMkJMXCwI7Q+e/2Z4c2H73D+7cfvqO+AySvPwNlTytwYFKUF4Pwth+8wbDx4m2hLkcGAZ8NRB4w6YIg6gIoN+SEaAgPuALT68z/57RHiq2NagSEaBVR1wH9KYpByAABMUWJohB3SVgAAAABJRU5ErkJggg==');
}
.share-ct .share-ct-inner a.twitter {
	background-color: #55acee;
	background-image: url('data:image/png;base64,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');
}
.share-ct .share-ct-inner a.reddit {
	background-color: #ff4500;
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAEjklEQVR4Ae1YA7QrSRB9b23btm1lvm3btm3btm3btm3bf27V7J03i5xkkmec3fQZVt+uvumuqlRNmJUsKR7/UVohWiFaIVpGYLknkWhpmvs1wyOa/A7rjzAepOIQ0hR3S97XUfBdTfMAXxOUliYPx6D6snM15g5B7xqokQJ5XtO090uGRzCihZw8KOdOYN4wyfMqmSUULS4Jp9+6DHs3Yt1cm8TFM3JiPzbMx6rpevum9XfDxK6a/M6EouUJQ6H35cxRtC2kKbllr0nV39C5DGYOkLPHLK8m21dqxkctI2Fo/RGGhlm4Qij/g2NVjnkp6Q5p7E0LyyZp6vsScLUGNZQjuyXHC+TkLZcCb2PzYkuVnOTYXlQzKEwgWpriTiweg+WTuYP+Zic5X0KbIuhcTop8aCULTyhP5MRZnsb+LRja2G0l/t3TKIauuNvB0l/LhdNomoNzJ4Eob0Qcv4WhVQE5fxLFPnXsPZFoeewdYfiR9A9LzheQ73VM7YUju8xSX0mO5ylkl7Nl8UPL4OFrIpr2QZT8HF3KYfZgbFkiR3YyXOnNa3r7Fh/4SiG7CCCMYN/1M3jEmBajthEu6R+RjI9r8rv4u3lIlqfQKj9Wz9CLp22HD95UCSMYLfNL5qccDVxFKqRaNe6wjOjSclx6cCPZukx2rsGUXij7DepnxJalat6yotk4xF6/+hlQ5htzSk8qpFrGWMn1ciBmAThlfx6rpnmrpjnrtUtWLJpevUQl3hJZPYOG6MosgLf3qGTvUXw3VbNnFVe3CBCvF40Jpg0mUxS9eMZSCQwSAgizYAZRhcXjOF0c0NLzJ9CtIgq8g2KfYHRbvXndH0Mhu2xAgXcJ5pA4oBV8E9Gvtnr+jlup7mda54KZO4xdTtwimEPiYBNdTd5peu0yyv3479/L7wzuBX1/gCojPrscDMEc4uouWD2dE1lGtAJEjhexdIIvrVs3UDut95Rmz6ou81HoRZ1DONAHQ+WMQcEDhPtWyshWHO+iLttzTjqA4p/Kvk3+GArZ5WAI5hAXPSNaOtSjTQvDmlr+TSBblmJAXQxvLod2WAEauwggjGBLxIUWU1ZPDGj9YScFKhIvAUvEbJEvhqvFZFdOHIgPWqyIpMBbMVktHqxCMbaDu16G00tnI1mSS+fk3HHXLoxpT+UxTWy4YPnekj0b/KL8bbNtYVT5HRvmMZ9xC6fX7PKw6h9m60Jq3vbltGe95HszeCoWhWy4uqEnD/qFnBm2G2Z8wibXszIm98CicTz4YL9W/V0yPYHin7Bw9V3mkwdQzRMXlY8RxrJdDm7zXZLThzGlJ+qmRcG3GAUk89M8wIcCb6FOWvKT04d9OR3YiurJ4u4bBNes6EdYMMp/y1jFs2iWg1uZRfHgxHyl0GVb549EkQ/juvLxROTKjbNh7Wy9ftmKciOYQ9A4K4fHz4ckI4Jc+odpHPRQ2bZcL5xSmK6Zj54/JduWEUYwh9iEjHitfJwqwwjn5w17Z+tnYurCkC2j2/DgA18pZBcBhMWsPotdhejxqpUNN0no22mIVohWiNb/hdafirEXE+rApJcAAAAASUVORK5CYII=');
}
.noresize{
	overflow-x: scroll ;
}
</style>`;
