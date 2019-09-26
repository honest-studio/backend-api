export const styleNugget = `

<style amp-custom>
body, html{
    width: 100%;
    text-align: center;
    background-color: #fefefe;
    float: left;
    position:relative;
    top:0px;
    font-family: 'Garamond',  Georgia;
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
    color: #3097d1;
    text-decoration: none;
}
a:visited{
    color: #3097d1;
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

amp-accordion.infobox-accordion, amp-accordion.media-gallery-accordion, amp-accordion.link-list-accordion{
    float: left;
    width: 100%;
}

amp-accordion>section>:first-child{
cursor: pointer;
background-color: transparent;
padding-right: 20px;
border: 0;
border-bottom: 1px solid #e9e9e9;
}

.-amp-accordion-header {
	cursor: pointer;
	background-color: #f8f8f8;
	border: 1px solid #e9e9e9;
	padding-top: 5px;
	padding-bottom: 0px;
	padding-left: 0px;
	padding-right: 0px;
}

ul.infobox{
    list-style: none;
    padding: 0px;
    height: auto;
    margin: 0px;
    display: inline-block;
    width: 100%;
    float: left;
}
ul.infobox li:first-child .info-an{
    border-top: none;
}

ul.infobox.list-plural{
    display: block
}
ul.infobox.list-plural li:first-child{
    float: left;
    border: 0px;
}
ul.infobox.list-plural li{
    font-size: 12.5px;
    border-top:1px solid #ececec;
    float: left;
    width: 100%;
    min-height: 20px;
}

ul.infobox.list-plural li p {
	margin:0px;
}

ul.infobox.list-plural > .row li:not([class]) > .info-qt{
	width: 100%;
	font-size: 13px;
    margin-top: 2px;
	padding: 0px;
	background-color: #fbfbfb;
	color: #333;
	text-align: left;
	float: left;
	border: 0px solid red;
	font-weight: bold;
	line-height: 16px;
}

ul.infobox.list-plural .info-an li:last-child {
	width: 100%;
}
.list-plural .info-an {
	padding-left:0px;
}


ul.infobox.list-plural > .info-an {
    width: 73%;
	text-align: left;
	word-break: normal;
	word-wrap: break-word;
	font-size: 13.5px;
	padding: 0px;
	margin-left: 0;
	line-height: 19px;
	float: right;
    position: relative;
    top: -6px;
}


ul.infobox.list-plural > .row .info-an button {
	margin: 0px;
	padding: 0px;
	padding-left:2px;
}



.infobox-main-wrap{
	float: left;
	margin: 0 15px;
	width: calc(100% - 30px);
	background: rgb(253, 253, 253);
	border: 1px solid #d9d9d9;
	margin-bottom: 20px;
}

.infobox-main-wrap .infbx-ct {
	font-size: 14px;
	height: auto;
	float: left;
	width: calc(100% - 30px);
	overflow-x: hidden;
	margin-top: 0;
	margin-bottom: 0px;
	border: 0 solid #d9d9d9;
	border-radius: 0 0 2px 2px;
	border-top: 0;
	padding: 15px;
	font-family: 'Poppins', Helvetica, Arial;
	padding-top:5px;
}




.infbx-ct h4 {
	padding: 0px;
	margin-bottom: 10px;
	float: left;
	width: 100%;
	text-align: center;
	margin-top: 5px;
	border-bottom: 1px solid #efefef;
	padding-bottom: 5px;
}


ul.infobox li {
    width: 100%;
    float: left;
    line-height: 1.6;
}

ul.infobox li:last-child {
	border-bottom: 0px;
}

.info-qt{
float: left;
width: 25%;
text-align: left;
font-weight: bold;
font-size: 13px;
line-height: 16px;
display: table-caption;
padding: 5px 0px;
word-wrap: break-word;
}
.infobox .info-qt h3{
font-size: inherit;
margin-top: inherit;
margin-bottom: inherit;
line-height: inherit;
font-weight: inherit;
}
.info-an{
	width: 73%;
	text-align: left;
	word-break: normal;
	word-wrap: break-word;
	font-size: 13px;
	margin-left: 0;
	line-height: 18px;
	padding-top: 4px;
	padding-bottom: 4px;
	padding-left: 3px;
    float: right;
}

ul.infobox li.plural-infobox:last-child {
	width:73%;
	float:right;
	text-align: left;
	border-bottom: 0px;
}

ul.infobox.list-plural > .row li.plural-infobox {
    line-height: 26px;
    padding-top: 0px;
    margin-top: -2px;
}


.infobox .info-an h2{
font-size: inherit;
margin-top: inherit;
margin-bottom: inherit;
line-height: inherit;
font-weight: inherit;
}

#first-paragraph {
	margin-bottom: 5px;
}

.ent-ct {
    text-align: left;
    word-break: break-word;
    width: 100%;
    font-size: 15px;
    line-height: 28px;
    color: rgb(45, 45, 45);
    float: none;
    display: block;
    overflow-x: hidden;
    font-family: 'Open Sans',sans-serif;
}

.ent-ct table:not(.blurb-inline-image-container):not(.amp-san-picfix) {
    display: inline;
    overflow-x: scroll;
    float: left;
    font-size: 12px;
    line-height: 18px;
    width: 100%;
    margin: 0 auto;
    border-collapse: collapse;
    margin-bottom: 15px;
}

.ent-ct table:not(.blurb-inline-image-container):not(.amp-san-picfix) button.tooltippableCarat{
    font-size: 10px;
}

.ent-ct table:not(.blurb-inline-image-container):not(.amp-san-picfix) > caption{
    width: 100%;
    float: left;
    display: block;
    text-align: left;
}

.ent-ct table:not(.blurb-inline-image-container):not(.amp-san-picfix) tbody{
    width: 1200px;
    float: left;
}

.ent-ct table:not(.blurb-inline-image-container):not(.amp-san-picfix) td {
    border: 1px solid rgba(128, 128, 128, 0.13);
    padding-left: 5px;
    padding-right: 5px;
    text-align: left;
}

.ent-ct table:not(.blurb-inline-image-container):not(.amp-san-picfix) th {
    border: 1px solid rgba(128, 128, 128, 0.13);
    padding-left: 5px;
    padding-right: 5px;
    text-align: left;
}
.ent-ct table.ep-table {
    margin-top: 10px;
}

.ent-ct table.ep-table .ep-table-hdr {
    background: #6d6d6d2b;
    color: #242424;
    font-weight: bold;
    font-size: 14px;
}

.ent-ct table.ep-table .ep-table-subhdr{
    background: #f5f5f5;
    font-size: 13px;
}


.ent-ct .ent-ct-inner-wrap{
    margin-left: 15px;
    margin-right: 15px;
}

.ent-ct p {
    margin: 0.5em 0 1em 0;
    padding: 0;
    line-height: 1.65;
}

.ent-ct h2 {
	font-size:26px;
	margin-bottom: 5px;
	margin-top:0px;
}

.ent-ct h3 {
	font-size:24px;
	margin-bottom: 5px;
}

.ent-ct h4 {
	font-size: 18px;
	margin-bottom: 5px;
}

.ent-ct h5 {
	font-size: 17px;
	margin-bottom: 5px;
}

.qf-header {
	font-family: 'Poppins', Helvetica, Arial;
	font-weight: 600;
	color: #272727;
	font-size: 17px;
	padding-bottom: 10px;
	text-align: left;
	padding-left: 15px;
	margin-right: -15px;
    background-color: transparent;
	padding-top: 16px;
	margin-bottom: 0px;
	margin-top: -5px;
	float: left;
	width: calc(100% - 36px);
	border: 0 solid #d9d9d9;
	border-radius: 2px;
	border-bottom: 0;
}

.qf-header span, .acc-header span {
    width: 30px;
    height: 20px;
    position: absolute;
    right: 0px;
    top: 7px;
    color: rgb(45, 45, 45);
    padding: 5px 5px 5px 5px;
    font-size: 20px;
    cursor: pointer;
}

.acc-header {
	font-weight: 400;
	color: #272727;
	font-size: 24px;
	padding-bottom: 8px;
	text-align: left;
	margin-left: 15px;
	margin-right: 15px;
	padding-left: 0px;
	padding-right: 2px;
	background: transparent;
	padding-top: 8px;
	margin-bottom: 10px;
	margin-top: 10px;
	border: 0px;
	border-bottom: 1px solid #E9E9E9;
}

  section[expanded] .show-more {
    display: none;
  }
  section:not([expanded]) .show-less {
    display: none;
  }
  .nested-accordion h4 {
    font-size: 14px;
    background-color: #ddd;
  }

#welcomeBanner {
    margin: 10px 15px 0 15px;
    background-color: #4d4d4d;
    color: #fff;
    font-size: 14px;
    font-family: 'Poppins', Helvetica, Arial;
    text-align: left;
    padding: 7px 15px 10px 15px;
    line-height: 20px;
    float: left;
    width: calc(100% - 60px);
    border-radius: 3px;
    line-height: 24px;
    display: none;
}

#welcomeBanner .banner-recent {
    padding: 5px;
    background: #878787;
    border-radius: 4px;
    margin-right: 3px;
}

.welcome-banner-empty-space{
margin-top: 75px;
}

#welcomeBanner a {
    color: white;
    background-color: #5baad7;
    padding: 3px 8px 2px 8px;
    border-radius: 2px;
    text-decoration: none;
    line-height: 2;
    margin: 0 2px 0 2px;
}

#welcomeBanner a.reddit-link {
    background-color: #da6363;
}

#welcomeBanner .close-banner-btn{
    background: transparent;
    border: none;
    color: white;
    float: right;
    padding: 0px;
    position: relative;
    right: -6px;
}

.ad-container-one, .ad-container-two{
    margin-top: 10px;
    float: left;
    text-align: center;
    width: 100%;
}
.ad-container-three {
    margin-left: 0px;
    margin-right: -15px;
    text-align: center;
}

#prf-lnk-ct{
	margin: 0px 5px 10px 5px;
	padding: 0px 6px 0px 0px;
	float: left;
	width: 100%;
	overflow: hidden;
	padding-top: 10px;
	padding-bottom: 10px;
}

.amp-profile-links a {
	display:block;
	margin-right:8px;
	float:left;
}

#prf-lnk-ct .row{
    padding: 3px 0px;
}

#prf-lnk-ct .row:not(:last-child){
    border-bottom: 1px solid rgba(128,128,128,0.13);
}

#prf-lnk-ct h6{
    font-size: 17px;
    display: block;
    margin: 0px 5px 0px 5px;
    background: #f4f4f4;
    color: white;
    padding: 5px;
}

#prf-lnk-ct .row .profilelink-url{
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre;
    float: left;
    line-height: 30px;
}

#prf-lnk-ct .row .profile-link-logo{
    float: left;
    flex: 0 0 auto;
    width: 35px;
    border-right: 1px dashed rgba(128,128,128,0.13);
    margin-right: 5px;
}

#prf-lnk-ct .row .profile-link-logo a{
    margin-left:5px;
}

#prf-lnk-ct .row .profile-link-logo a amp-img{
    float: left;
}


.tb-header {
	font-family: 'Poppins', Helvetica, Arial;
	font-weight: 600;
	color: #272727;
	text-align: left;
	padding-left: 7px;
	padding-right: 9px;
	background: transparent;
	padding-top: 5px;
	width: 15px;
	top: -15px;
	padding-bottom: 11px;
	font-size: 12px;
	height: 15px;
	right: -86.5%;
	border: 0px;
	z-index: 1;
}

.tb-header-alternate{
font-family: 'Poppins', Helvetica, Arial;
    font-weight: 600;
    color: #272727;
    text-align: left;
    background: transparent;
    padding-top: 5px;
    width: 15px;
    padding-bottom: 5px;
    font-size: 12px;
    border: 0;
    z-index: 1;
}

.tb-header .icon {
	border: 0px;
	background: transparent;
	font-size: 22px;
	color:#666;
}


.toolbox-accordion {
	border: 0;
	width: 30px;
	margin: 0;
	padding: 0;
	position: relative;
	float: left;
	display: block;
    border-bottom: 0;
}

.toolbox-accordion .icon::before {
	margin-top:6px;
	color: #666;
}

.toolbox-edit .icon {
	font-size: 20px;
	color: #666;
	float: left;
	width: 30px;
	margin-top: 6px;
	margin-left: 10px;
}


.tlbx-ct-wrapper{
    height: 30px;
    margin-top: 10px;
}


.tlbx-ct ul {
	list-style-type: none;
	float: left;
	padding: 0px;
	margin-left: 0px;
	width: calc(100% - 15px);
	margin-bottom: 5px;
	margin-top: 5px;
	z-index:99999;
}

.tlbx-ct li {
	float:left;
	margin-right:15px;
}

.tlbx-ct button {
	border:0px;
	background:transparent;
	padding: 0px;
}

.tlbx-ct li .icon {
	font-size: 20px;
	color: rgb(84, 78, 82);
	float:left;
    cursor: pointer;
}

.tlbx-ct li.language-tile {
    margin-left: 2px;
}


.tlbx-ct li.pageviews-tile {
    margin-left: -5px;
    margin-top: 1px;
}


.tlbx-ct li .views-nr {
    font-size: 13px;
    font-family: 'Poppins',Helvetica,Arial;
    float: left;
    margin-top: 3px;
    margin-left: 7px;
    color: #544e52;
}

.tlbx-ct #flag-button{
    position: relative;
    top: -5px;
}

.tlbx-ct .flag-lang-plain{
    text-transform: uppercase;
    margin-left: 7px;
    font-size: 14px;
    position: relative;
    top: 5px;
    float: right;
    font-weight: bold;
}

.name-container {
	width:calc(100% - 30px);
	float:left;
    margin-top: 5px;
    padding:0 15px;

    border-bottom: 1px solid #DFDFDF;
}

.name-container h1 {
    text-align: left;
    margin: 0px;
    font-size: 40px;
    color: #262626;
    font-weight: 400;
    float: left;
}

.name-container h1 button {
	border: 0px;
	background: transparent;
	font-size: 20px;
	display:none;
}

.name-container h1 button a {
	color: #666;
}

.name-container .verified-page-logo{
    position: relative;
    top: -8px;
    left: -2px;
    display: inline-block;
}

#title-buttonset{
    float: left;
    position: relative;
    width: 100%;
}

#title-buttonset > .micro-image-top, .name-container .micro-image-top{
    display: inline;
}

#title-buttonset > .micro-image-top img, .name-container .micro-image-top img{
    overflow: hidden;
}

.about-container {
    float: left;
    width: 100%;
}
.about-container h6 {
    font-size: 22px;
    text-align: center;
    display: block;
    margin: 5px 0px 0px 0px;
}

.disclaimer {
	text-align: left;
	font-size: 13px;
	color: #666;
	font-style: italic;
    margin: 5px 15px;
    line-height: 1.4;
}


.l-lst-header {
    float: left;
    display: block;
    width: 100%;
    background: white;
}

.l-lst-header .ll-wrapper{
    float: left;
    width: 100%;
}


#link_list_container_mobile_wrapper ul.l-lst{
    margin-top: 10px;
}

ul.l-lst{
    list-style: none;
    width: calc(100% - 30px);
    float: left;
    overflow-x: hidden;
    margin-bottom: 0px;
    font-family: "Poppins", Helvetica, Arial;
    padding: 0px 15px 0px 15px;
}

ul.l-lst li {
    float: left;
    width: 100%;
    color: #383838;
    border-bottom: 1px solid #f3f3f3;
    padding-bottom: 10px;
    margin: 0px 0px 10px 0px;

    display: inline-flex;
    flex-direction: row;
}


ul.l-lst li .link-image{
    float: left;
}

ul.l-lst li .link-image img {
    object-fit:cover;
    background: #fafafa;
	border-radius: 2px;
}



ul.l-lst li .link-box-left {
	flex: 0 0 35px;
	float: left;
    position: relative;
    top: -5px;
}

#likebutton, #dislikebutton {
	border: 0 none;
	font-size: 17px;
	height: 22px;
    color: #999;
	cursor: pointer;
	background-repeat:no-repeat;
    background-size:100% auto;
    background-color: transparent;
	margin: 0 auto;
	display: block;
}

ul.l-lst li .link-box-left #vote_value {
    width: 20px;
    text-align: center;
    font-size: 13px;
    margin-bottom: 0;
    margin-top: 0;
}

ul.l-lst li .link-box-left [data-role="like_container"]{
    text-align: center;
    display: inline-block;
}


.link-box-left .icon::before {
    top: 0;
}

ul.l-lst li .link-box-right{
	min-height: 35px;
	flex: 1;
	float: left;
	padding-left: 0px;
	margin-left: 0px;
	font-size: 13px;
	text-align: left;
	word-break: break-all;
	overflow: hidden;
	text-overflow: ellipsis;
}
ul.l-lst li .link-url {
    font-size: 12px;
    width: 100%;
    float: left;
    text-align: left;
    color: #3097d1;
    word-break: normal;
}
ul.l-lst li .link-url a{
    color: #3097d1;
    width: 100%;
    width: auto;
    float: left;
    padding: 0px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-bottom: 5px;
}

ul.l-lst li .link-box-right .link-comment {
    font-size: 12px;
    padding: 0px 0px 3px 0px;
    line-height: 1.25;
    word-break: normal;
}

ul.l-lst li .link-box-right .link-comment button.tooltippable{
    font-family: "Poppins", Helvetica, Arial;
    margin: 0px;
}

ul.l-lst li .link-box-right .link-comment .thumbcaption {
    display: inline;
    text-align: left;
}

.avatar-wrap {
    margin-right: 10px;
}

ul.l-lst li .link-box-details{
    font-size: 11px;
    float: left;
    width: 100%;
}

.link-box-details .icon-chat {
	color:#999;
}

ul.l-lst li .link-box-details .link-date{
    float: left;
}

ul.l-lst li .link-box-details .link-date > a{
    color: #666;
}

ul.l-lst li .link-box-details .lil-bullet{
    float: left;
}
ul.l-lst li .link-box-details .link-comment-details{
    float: left;
    margin-left: 5px;
    font-weight: normal;
    color: black;
}
ul.l-lst li .link-box-details > a{
    font-size: 15px;
    float: left;
    color: #999;
    margin-top: -2px;
}

ul.l-lst li .link-box-details.vote-block{
    margin-top: 5px;
}

ul.l-lst li .link-box-details a.vote-button {
    padding: 0 1px;
    font-size: 14px;
    cursor: pointer;
    background-color: transparent;
    display: inline;
    height: 14px;
    width: 14px;
}

ul.l-lst li .link-box-details .vote-count {
    margin: 0 7px;
    font-size: 11px;
    display: inline;
    float: left;
    padding-top: 2px;
}

ul.l-lst li .link-box-details a.like-button{
    color: #00b800;
    background: rgba(0, 128, 0, 0.1);
}

ul.l-lst li .link-box-details a.dislike-button{
    color: red;
    background: rgba(216, 130, 130, 0.1);
}


.photo-gallery .tile-desc{
    padding: 5px 4px 3px 0px;
    height: 44px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    border-top: 0 solid rgba(225,232,237,0.34);
    font-family: Garamond, Georgia, Times;
    font-style: italic;
    margin-bottom: 6px;
}

.photo-gallery .tile-desc .magnify, .mainphoto-caption .magnify, ul.l-lst li .link-box-right .link-comment .magnify, .blurbimage-caption .magnify{
    display: none;
}

.photo-gallery .tile-desc .grid-attribution{
    display: inline-block;
    float: left;
    margin-right: 5px;
    font-size: 11px;
    color: #3097d1;
    cursor: pointer;
}

.photo-gallery .tile-desc .grid-attribution:hover{
    opacity: 0.7;
}

.photo-gallery .ad-container-regular{
    float:left;
    width:100%;
    margin-left:-15px;
}

.photo-gallery .video-wrapper{
    top: 0;
    left: 0;
    right: 0;
    position: relative;
}

.photo-gallery .video-wrapper .video-overlay{
    background-image: url('https://epcdn-vz.azureedge.net/static/images/placeholder-video.png');
    background-repeat: no-repeat;
    background-attachment: inherit;
    background-size: cover;
    background-position: 50% 50%;
    width: 100%;
    height: 100%;
    z-index: 4;
    position: absolute;
    cursor: pointer;
}

.photo-gallery .video-wrapper video{
    object-fit: cover;
    max-width: 100%;
    vertical-align: middle;
}

.pic-video-container{
    float:left;
    width:100%;
}

.pic-video-container h6, .l-lst-header h6, .top-editors h6, .recent-activity h6, .top-page-editor-header h6{
	text-align: left;
	font-size: 0.9em;
	color: #333;
	font-family: 'Poppins', Helvetica, Arial;
	font-weight: 400;
	padding-left: 15px;
	text-transform: uppercase;
	padding-top: 5px;
	padding-bottom: 5px;
	float: left;
	width: 100%;
	margin: 0px;
	margin-top: 15px;
}

.top-page-editor-header h2 {
	font-size: 17px;
    font-family: 'Poppins', Helvetica, Arial;
    font-weight: normal;
    text-transform: uppercase;
    color: #272727;
    margin: 0px;
    padding-top: 20px;
    margin-bottom: 0px;
}

#Reference_Links .disclaimer{
    font-size: 15px;
    font-weight: normal;
    padding: 5px;
    float: left;
    width: auto;
}
.tile-ct {
	width: calc(50% - 16px);
	float: left;
	display: block;
	margin: 0 3px 3px 0px;
}
.tile-desc{
    font-size: 12px;
    width: auto;
    text-align: left;
}

.youtube-ct .icon {
	position: absolute;
	font-size: 24px;
	color: #FFF;
	z-index: 9999;
	display: block;
	opacity: 0.7;
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
}

.blurb-photo-container {
    width: 100%;
    float: left;
    text-align: center;
    margin: 0px 0px 0px 0px;
}

.blurb-photo-container img {
	object-fit: cover;
    object-position: top;
}

.blurb-photo-container amp-img, .blurb-photo-container amp-anim{
    max-height: 320px;
}

.blurb-photo-container .blurb-photo-anchor{
    float: left;
    width: 100%;
}

.photo-gallery img{
    object-fit: cover;
	font-size:10px;
	color:#FFF;
}

.photo-gallery{
    float: left;
    text-align: center;
    width: 100%;
    margin-top:0px;
    margin-left:15px;
}

a.photo-gallery-anchor{
    height: 250px;
    width: 300px;
}

#blbx_ct {
width:100%;
float:left;
overflow:hidden;
list-style-position:inside;
background-color:transparent;
font-size:13px;
color: #262626;
}

#blbx_ct .infobox {
width:100%;
max-width:100%;
border-collapse: collapse;
border-spacing: 0em;
margin-left: 0px;
}

#blbx_ct #coordinates {
display: none;
}

#blbx_ct tr {
border-bottom:1px solid rgba(128,128,128,0.065);
max-width:100%
}

#blbx_ct tr p {
margin:0
}

#blbx_ct * {
max-width:100%;
font-size: 12px;
}

#blbx_ct img:not(.geodot) {
float:left
}

#blbx_ct td {
padding-left:7px;
max-width:100%;
white-space:normal;
word-wrap: break-word;
}

#blbx_ct td span {
white-space:normal;
line-height:20px;
}

article .flagicon{
margin: 0px 3px;
}


#blbx_ct tr td.maptable table tr td{
    text-align: center;
    padding: 5px 0px;
}

#blbx_ct tr td.photo[colspan="2"], #blbx_ct tbody > tr td[colspan="2"]{
text-align: center;
margin: 5px auto;
}

#blbx_ct tr td[colspan="2"] > a.image{
    margin: 5px auto;
    display: block;
    text-align: center;
}

#blbx_ct tr td a.image{
    margin: 0 auto;
    text-align: center;
    display: block;
}

#blbx_ct tr td sup, .infbx-ct tr td sup{
margin-left: 5px;
top: 3px;
position: relative;
font-size: 12px;
}

#blbx_ct tr td sup button, .infbx-ct tr td sup button{
font-size: 12px;
}

#blbx_ct tr th:not([colspan]) {
text-align:left;
padding:3px 6px 3px 3px ;
border-right:0px dashed rgba(128,128,128,0.13);
border-top:1px solid rgba(128,128,128,0.065);
border-bottom:1px solid rgba(128,128,128,0.065);
}

#blbx_ct tr th[colspan] {
font-size:110%;
padding-top:3px;
padding-bottom:3px;
}

#blbx_ct tr th.navbox-title {
background:#f5f5f5
}

#blbx_ct tr td {
	max-width: 100%;
	vertical-align: middle;
	border-top: 1px solid rgba(128,128,128,0.065);
	border-bottom: 1px solid rgba(128,128,128,0.065);
	text-align: left;
	padding-top: 4px;
	padding-bottom: 4px;
	padding-left: 0px;
}

#blbx_ct tr td .floatnone{
float: none;
text-align: center;
}

#blbx_ct tr td ul {
	padding-left:0px;
}


#blbx_ct tr td p {
word-break:break-all
}

#blbx_ct tr td img {
object-fit:contain
}

#blbx_ct tr.mergedtoprow th[colspan="2"] {
text-align:center
}

#blbx_ct table.geography tr.mergedtoprow th[colspan="2"] {
background-color:rgba(78,228,78,0.3)
}

#blbx_ct td:first-child img {
width:100%;
text-align:center
}

#blbx_ct caption.fn,#blbx_ct span.fn,#blbx_ct table caption {
padding-top:0;
padding-bottom:0;
color:initial;
text-align:center;
font-size:18px;
font-weight:700;
margin: 0px 0px 10px 0px;
}

#blbx_ct tr td.plainlist {
padding-left:5px;
padding-right:5px
}


#blbx_ct li:last-child, #blbx_ct tr td.plainlist li,#blbx_ct .hlist li, #blbx_ct tr td.plainlist li:last-child,#blbx_ct .hlist li:last-child,#blbx_ct li:last-child {
border-bottom:none
}

#blbx_ct tr:last-child {
    border-bottom: 1px solid rgba(128,128,128,0.13);
}

#blbx_ct tr:last-child td, #blbx_ct tr:last-child th{
    border-bottom: 1px solid rgba(128,128,128,0.13);
}

#blbx_ct li {
list-style-type:none
}

#blbx_ct td.label {
font-size:100%;
text-align:left;
font-weight:400;
display:block;
line-height:inherit
}

#blbx_ct div.geonugget,#blbx_ct div.geonugget * {
max-width:initial
}

#blbx_ct div.geonugget img {
float:none;
width:auto
}

#blbx_ct div.geonugget img.geodot{
    display: none;
}

#blbx_ct .NavFrame,#blbx_ct .NavHead,#blbx_ct .NavContent {
padding:3px;
text-align:center
}

#blbx_ct .NavFrame .NavToggle {
display:none
}

#blbx_ct .ep-blobbox-tbl-hdr{
    text-align: center;
    font-weight: bold;
    margin: 3px 0px;
}

#blbx_ct .ep-blobbox-tbl-hdr p{
    text-align: center;
}

.plural-infobox h2 {
	margin:0px;
}

#blbx_ct .infobox table {
width:100%;
float:left;
overflow:hidden;
    border-collapse: collapse;
}

#blbx_ct .infobox table tr {
border-bottom:inherit
}

#blbx_ct .infobox table tr td {
max-width:100%;
padding-top:inherit;
padding-bottom:inherit;
vertical-align:middle
}

#blbx_ct table.ep-blobbox-table th {
border-right:inherit
}

.infobox .info-an .addl-schema-line {
display:inline
}

.infobox .plural-div {
width:auto;
border-bottom:1px solid rgba(128,128,128,0.13)
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

.amp-nav-bar .nav-container  {
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
    font-weight: 400;
    font-size: 11px;
    text-align: center;
    font-style: normal;
    color: #FFFFFF;
    margin: 0px;
    max-height: none;
    overflow: visible;
    text-overflow: auto;
    opacity: 1;
    font-weight: 600;
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

.ent-ct h2:before,
.ent-ct h3:before,
.ent-ct h4:before,
.ent-ct h5:before,
.ent-ct h6:before,
#infoboxHeader

{
  display: block;
  content: " ";
  margin-top: -40px;
  height: 60px;
  visibility: hidden;
}

.ent-ct h2 > span.mw-headline:before,
.ent-ct h3 > span.mw-headline:before,
.ent-ct h4 > span.mw-headline:before,
.ent-ct h5 > span.mw-headline:before,
.ent-ct h6 > span.mw-headline:before
{
  display: block;
  content: " ";
  margin-top: -40px;
  height: 60px;
  visibility: hidden;
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
}

#amp-header-bar{
position:  fixed;
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
color: #3097d1;
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
	font-family: 'Poppins', Helvetica, Arial;
	z-index: 9999;
}

.usermenu-header {
	background: #fafafa;
	height: 48px;
	border-bottom: 1px solid #EFEFEF;
}


.usermenu-header .loggedin-default {
    line-height: 41px;
    font-size: 17px;
    text-align: center;
    float: left;
    margin-top: 3px;
    color: #555;
    width: 100%;
    padding-left:3px;
}

.usermenu-header .loggedin-info{
    font-size: 15px;
    float: left;
    height: 100%;
    width: 100%;
}

.usermenu-header .img-circle.loggedin-userphoto{
    display: inline-block;
    width: 38px;
    height: 38px;
    margin: 4px 11px 5px 16px;
    vertical-align: baseline;
    float: left;
    border-radius: 25px;
}

.usermenu-header .loggedin-grp {
    display: inline-block;
    font-size: 14px;
    line-height: 20px;
    float: left;
    margin-top: 3px;
    color: #555;
}
/*.usermenu-header .loggedin-scatter-only{*/
    /*width: 100%;*/
/*}*/

.usermenu-header .loggedin-plainname {
    text-align: left;
    /*padding: 0px 0px 3px 0px;*/
}

.usermenu-header .loggedin-username {
    text-align: left;
    /*padding: 0px 0px 3px 0px;*/
}

.usermenu-header .loggedin-scatter-only{
    line-height: 41px;
    font-size: 17px;
}

.usermenu-header a {
	color: #555;
	width: 90%;
	float: left;
}

.usermenu-header amp-img {
	float:left;
	border-radius: 100%;
	border: 1px solid #efefef;
}

.usermenu-header h2 {
	float: left;
	margin: 0px;
	margin-left: 14px;
	margin-top: 8px;
	font-family: 'Poppins', Helvetica, Arial;
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
flex: 0 0 auto; width: 40px;
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
flex: 0 0 auto; width: 40px;
margin: 5px;
margin-bottom: 0px;
}

amp-sidebar{
background: #4C4C4C;
color: #EFEFEF;
border-right: 1px solid #4C4C4C;
font-family: 'Poppins', Helvetica, Arial;
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

amp-sidebar .heading-collection li{
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
#pg-opts{
float: left;
display: flex;
text-align: right;
width: 100%;
font-size: 20px;
padding: 5px 0px 5px 0px;
background-color: #f4f4f4;
}
#pg-opts a{
color: #333;
}
#pg-opts .view-count, #pg-opts #edit-page-ico, #pg-opts .toc-button, #pg-opts .edit-button,
#pg-opts .notify-button{
font-size: 15px;
line-height: 15px;
padding: 9px 0px 0px 0px;
text-align: center;
}
#pg-opts .toc-button, #pg-opts .edit-button, #pg-opts .notify-button {
float: left;
width: 30%;
text-align: center;
padding:0px;
}
#pg-opts .toc-button button, #pg-opts .edit-button button, #notify-options .edit-button button {
color: #333;
width: 100%;
margin: 0px;
height: 100%;
padding-top: 5px;
font-size: 24px;
line-height: 24px;
}

#pg-opts .view-count {
float: right;
width: 40%;
background: #f4f4f4;
}
#pg-opts #edit-page-ico a{
    color: #333;
}
#pg-opts .everipedia-branding{
    font-family: Lobster;
    flex-grow: 1;
    text-align: center;
    font-size: 17px;
    line-height: 29px;
    color: #60acdb;
    border-top: 1px solid rgb(228, 228, 228);
    border-bottom: 1px solid rgb(228, 228, 228);
}

.heading-collection > li{
display: block;
float: left;
width: 100%;
text-align: left;
}
.heading-collection > li a{
width:100%;
display: block;
text-decoration: none;
}

.heading-collection > li .icon{
flex-grow: 1;
font-size: 25px;
width: 37px;
float: left;
margin: 5px 0px 0px 10px;
display: block;
flex-shrink: 1;
display:none;
}

.heading-collection > li .fixed-items-description{
padding-top: 3px;
display: block;
font-size: 17px;
color: #EFEFEF;
padding-left: 20px;
line-height: 36px;
padding-bottom:3px;
}

.heading-collection > li:first-child .fixed-items-description{
    font-size: 20px;
    font-weight: bold;
}

.heading-collection > li:not(:last-child){
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
amp-lightbox {
width: 100%;
position: fixed;
top: 0px;
background: rgba(0, 0, 0, 0.55);
display: none;
}

amp-lightbox.amp-hc {
position: fixed;
bottom: 0;
left: 0;
width: 100%;
}

amp-lightbox.amp-hc .hvr-lghtbx-amp-ad-ct{
position: fixed;
top: 0;
left: 0;
height: 52px;
width: 100%;
padding: 0px 0px;
background: rgba(255,255,255,.7);
}

amp-lightbox.amp-hc .hvr-lghtbx-amp-ad-ct .hvr-lghtbx-amp-ad{
margin-top: 1px;
}

amp-lightbox.amp-hc amp-iframe {
height: 61.8%;
top: 37%;
position: relative;
width: 96%;
margin-left: auto;
margin-right: auto;
border-radius: 6px;
}

amp-lightbox.amp-hc amp-iframe > iframe{
border-radius: 6px;
}



button.close-amp-lightbox-btn {
    width: 100%;
    font-family: 'Poppins', Helvetica, Arial;
    padding: 10px 15px 10px 15px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    bottom: 0px;
    position: fixed;
    margin: 0px;
    left: 0px;
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.35);
    background-color: rgba(0, 0, 0, 0.80);
    /* box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2); */
    color: rgba(255, 255, 255, .95);
}
.amp-hc-iframe{
width: 100%;
background: white;
}
button.tooltippable{
	color: rgb(56, 128, 224);
    border: none;
    background: none;
    font-size: inherit;
    padding: 0px;
    font-family: 'Open Sans',sans-serif;
    display: inline;
    cursor: pointer;
    white-space: normal;
    text-align: left;
    margin: 0px 1px;
}
button.tooltippableCarat{
	color: rgb(56, 128, 224);
	border: 0;
	background: 0;
	font-size: 12px;
	padding: 0;
	font-family: 'Open Sans',sans-serif;
	top: -6px;
	position: relative;
	display: inline;
	cursor: pointer;
	margin-left: 1px;
	margin-right: 1px;
}

.photo-gallery button.tooltippableCarat, ul.l-lst li button.tooltippableCarat{
    font-size: 10px;
    top: -5px;
}

.infbx-ct button.tooltippable, .infbx-ct button.tooltippableCarat{
	font-size: inherit;
	font-family: "Poppins", Helvetica, Arial;
	line-height: inherit;
    margin-left: 0px;
}

.page-times{
    margin-top: 13px;
    line-height: 20px;
    text-align: center;
    font-size: 13px;
    display: block;
    font-style: italic;
    float: left;
    width: 100%;
    position: relative;
    z-index: 15;
    color:black;
}

.footer {
    margin-top: 25px;
    background: #f8f8f8;
    border-top: 1px solid #ebebeb;
    text-align: center;
    float: left;
    width: 100%;
    position: relative;
    z-index: 15;
    font-family: "Poppins", Helvetica, Arial;
}

.footer .copyright {
    color: #666;
    font-size: 14px;
    font-family: "Poppins", Helvetica, Arial;
    padding: 10px 15px 10px 15px;
}

.footer .cayman-flag-footer {
    position: relative;
    top: 6px;
    left: 2px;
}

.footer .footer-separator {
	width:74%;
	border-bottom: 1px solid #c6c2c4;
	margin-left: auto;
	margin-right: auto;
}

.footer .copyright .disclaimer {
	width: auto;
	display: block;
	text-align: center;
	font-size: 14px;
	margin-top: 7px;
	font-style: normal;
}

.footer .copyright .disclaimer a {
	font-size: 14px;
	color: #3097d1;
	margin-right: 0px;
}

.footer .copyright .cc-img {
    position: relative;
    top: 3px;
}


.footer .footer-links {
    color: #666;
    font-size: 14px;
    font-family: "Poppins", Helvetica, Arial;
    padding: 20px 10px 20px 10px;
    margin-left:auto;
    margin-right:auto;
    width: 85%;
    line-height: 24px;
}

.footer a {
    color: #666;
    display: inline-block;
	margin-right: 10px;
	font-size: 14px;
	font-family: 'Poppins', Helvetica, Arial;
	line-height: 20px;
}

.footer .footer-social, .footer .eos-powered-line {
	padding-bottom: 30px;
    font-size: 14px;
    color: #666;
}

.footer .footer-social{
    padding-bottom: 19px;
}

.footer .eos-powered-line a{
    margin-right: 0px;
}

.footer .eos-powered-line > a.eos-link{
    border-right: 1px solid #666;
    padding-right: 5px;
    margin-right: 8px;
}

.footer .eos-powered-line .liberty-footer-img {
    width: 50px;
    height: 40px;
    position: relative;
    top: 8px;
    left: -3px;
}

.footer .eos-powered-line .scatter-footer-img {
    position: relative;
    top: 5px;
    left: -2px;
}


.footer .eos-powered-line #powered-by-eos, .footer .eos-powered-line #api-by-libertyblock, .footer .eos-powered-line #api-by-scatter{
    position: relative;
    top: -8px;
    right: 2px;
}

.footer img.eos-footer-img, .footer img.eos-footer-img {
border-radius: 3px;
margin-left: 3px;
}

.footer .app-footer-container{
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

#ep-byline{
width: 100%;
float: left;
font-size: 14px;
margin: 0px 0px 10px 0px;
padding: 10px 0px;
border-top: 1px solid rgba(128,128,128,0.13);
border-bottom: 1px solid rgba(128,128,128,0.13);
}

#ep-byline .author-tag, #ep-byline .published-dates, #ep-byline .published-dates div{
display: inline-block;
float: left;
}

#ep-byline .published-dates div{
margin-left: 5px;
padding-left: 5px;
border-left: 1px solid rgba(128,128,128,0.13);
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
    font-family: 'Poppins', Helvetica, Arial;
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
    font-family: 'Poppins', Helvetica, Arial;
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
    font-family: 'Poppins', Helvetica, Arial;
    font-weight: normal;
    text-transform: uppercase;
    color: #272727;
    margin-bottom: 35px;
}

.share-ct .share-hshtgs{
font-family: "Poppins", Helvetica, Arial;
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
    font-family: "Poppins", Helvetica, Arial;
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
    font-family: "Poppins", Helvetica, Arial;
    top: -10px;
    left: 10px;
    font-size: 18px;
}

.infobox-main-wrap .ad-container-regular .ad-top-spacer.ad-container-noborder{
    border: none;
}


.infobox-main-wrap .ad-container-regular{
    margin-left: -15px;
    width: calc(100% + 30px);
    float: left;
    height: 293px;
}

.infobox-main-wrap .ad-container-regular .ad-top-spacer, .infobox-main-wrap .ad-container-regular .ad-dual-spacer{
    width: 100%;
    margin-left: 0px;
}

.hidden-meta{
    visibility: hidden;
    height:1px;
    color:white;
    line-height:1px;
}


.noavatar-filler {
	display: block;
	margin-top: 55px;
	float: left;
	width: 100%;
}

.mainphoto-caption {
	float: left;
	width: 89%;
	font-size: 13px;
	font-style: italic;
	color: #666;
	text-align: left;
	padding-left: 20px;
	padding-right: 20px;
	padding-top: 10px;
	padding-bottom: 0px;
}

.mainphoto-caption button.tooltippable{
	font-size: 11px;
	font-family: inherit;
	font-style:italic;
}
section .machine-infobox{
padding: 5px 0px;
border-bottom: 0px solid rgba(128, 128, 128, 0.21);
}
section h6 div{
line-height: 11px;
padding: 2px 0px 1px 0px;
font-size: 17px;
}

table.blurb-inline-image-container, div.amp-san-picfix {
    margin: 15px 0px 15px 0px;
    background-color: transparent;
    border-bottom: 0px;
    border: 0px;
    width: 100%;
}


table.blurb-inline-image-container amp-img, div.amp-san-picfix amp-img,
table.blurb-inline-image-container amp-video, div.amp-san-picfix amp-video,
table.blurb-inline-image-container amp-anim, div.amp-san-picfix amp-anim{
    display: block;
    width: calc(100% + 44px);
    min-height: 250px;
    margin-left: -22px;
}

table.blurb-inline-image-container amp-img{
    height: 250px;
}

table.blurb-inline-image-container tbody img, div.amp-san-picfix img{
height: 250px;
object-fit: cover;
}



table.blurb-inline-image-container caption.blurbimage-caption {
font-family: 'Garamond', Garamond, Georgia;
font-size: 13px;
line-height: 1.4em;
padding: 8px 8px 5px 8px;
caption-side: bottom;
color: rgb(68, 68, 68);
word-break: break-word;
text-align: left;
background-color: transparent;
border-left: 0px solid rgb(200, 204, 209);
border-bottom: 0px solid rgb(200, 204, 209);
border-right: 0px solid rgb(200, 204, 209);
font-style: italic;
}

table.blurb-inline-image-container caption.blurbimage-caption .tooltippable, table.blurb-inline-image-container caption.blurbimage-caption .tooltippableCarat {
font-size: 12px;
}



table.blurb-inline-image-container .inline-video-wrapper{
    top: 0;
    left: 0;
    right: 0;
    position: relative;
}

table.blurb-inline-image-container .inline-video-wrapper a.inline-video-overlay:before{
    content: "";
    background-image: url('https://epcdn-vz.azureedge.net/static/images/placeholder-video.png');
    background-repeat: no-repeat;
    background-attachment: inherit;
    background-size: contain;
    background-position: 50% 50%;
    width: 100%;
    height: 100%;
    z-index: 4;
    position: absolute;
    cursor: pointer;
}

table.blurb-inline-image-container .inline-video-wrapper amp-video, table.blurb-inline-image-container .inline-video-wrapper amp-img{
    object-fit: cover;
    vertical-align: middle;
}

table.blurb-inline-image-container .inline-video-wrapper amp-video video{
    object-fit: cover;
}


h6.accordion-dummy-header{
visibility: hidden;
}


#pageCommentContainer, #seeAlsoPanelContainer{
    float: left;
    width: 100%;
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
    background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M101.3%20141.6v228.9h0.3%20308.4%200.8V141.6H101.3zM375.7%20167.8l-119.7%2091.5%20-119.6-91.5H375.7zM127.6%20194.1l64.1%2049.1%20-64.1%2064.1V194.1zM127.8%20344.2l84.9-84.9%2043.2%2033.1%2043-32.9%2084.7%2084.7L127.8%20344.2%20127.8%20344.2zM384.4%20307.8l-64.4-64.4%2064.4-49.3V307.8z%22%2F%3E%3C%2Fsvg%3E');
}
.share-ct .share-ct-inner a.facebook {
    background-color: #4a6ea9;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7DAAAOwwHHb6hkAAABeElEQVRYhWP0zF35j5GRgZFhIMD///+ZBsxyBgYGBkZGRqYBsxwKBtwBLJRolhDmZvC3V2XQVxNnEObnZGBkZGD4/ecfw7X7bxha5x6jrQOs9aUZimMtGNhZmTHkhPg4iDaHLAdIinAzlMRaMLBhsZyBgYHh9+9/tHWAj60qhuV///1j+PHzDwMDAwPDt5+/aesADQUhFP75my8YmuccZfj56y/JZpGVC9hZUd199voLsiwn2wHo4N+//2TrHTrlgKaCMAMXJysDAwMDAxcHqjZZcT4GY00JOP/bj98M1++/JcpcRq+8lUSF3+RSVwYlGUGiDL3z+B1Dfs8eotTSJAq+/fhDtFqaOABWHhADiE4Dtx69Z/jyHVLAqMkJMXCwI7Q+e/2Z4c2H73D+7cfvqO+AySvPwNlTytwYFKUF4Pwth+8wbDx4m2hLkcGAZ8NRB4w6YIg6gIoN+SEaAgPuALT68z/57RHiq2NagSEaBVR1wH9KYpByAABMUWJohB3SVgAAAABJRU5ErkJggg==');
}
.share-ct .share-ct-inner a.twitter {
    background-color: #55acee;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAFyklEQVR4Ac2aA4wlWRSGd4NVvA4XcbIIe4O1oo3mvZ61bdu2bY/aY9u2bT0bVWfPt7kzGdXtqvde9fRN/kF3Xfx1fG4dc92DT9aFPoNixza3xE6JtsYua26NP6vor5ij2BptjecUDtD/5/gZv4vyDM+2xC7TeaewRr3nqHlipDV+gh7mIsVbimmKvYqqQnyiauYw901FE2uGQcRCIHatefO7Fa5C6oRr1uqnuKYWQoFUKNoSu0DV4nfdLKmQkJDQPX5jL/ZsKBFd+CTFfbrJWoX0ENY0t8TvbR4UP6kRRCBxpi76rSKvkB5GXsl8HW2Jn14XkUhr7Bwl0qkLOgo5SnAUHZGW+Nm1EIHEuUpiBIv1BnAWXmwgIqiTkYT0MnR4qdkRDdvYhNMLiTjYDA6gWyL68P3hG3bdDuBeKxFNFy7E7YWu7y1xiRwA/h/UNRNnjkiEaEogCpvA9W1xeXRkUt6dkpHPZmblzUlpuX9Ykt8fRChi/t3X2/h/UTLHH0bEpB0J20Fu6kjIje0sUhuJx0elZOTaouzKOlKqulJxRIoVV7akqjJwWV7uHZqUPobsk6NT8u2crNw5OOG1X0JxzUFETALYz3YQ3hALD1iaD0wGEi+OT8v6RFW8huuKLNhRlt8W5mTixpLszjnSurxgJOKJf5X48fuJmCx2t+0wHH7WtrKUHZF+S/JIhwP6IoHqrNxbET8DQq6IzNhalodHJOUBnYuEPNbfxdkPJPKW9TCKu4ck9r9R1GLo6iI/Q1LdEvlrcZ7D+R57VBpj1hcFMl/MynYnlTf/J6IGcyo1QXdE7hmSlA0HqIbjiizcWZbXJqalbxuqd+R5t3UmZPGusgQZkMZ+ulYV5BYkbycyNdoWPwWXe5kpcMSGm3VBdPjQkSg4MmR1QZ4Zk0IFjDs9WK12qnEHGfmKiy36IQH26DOXolbP+qnsIkZFvEYs78gENVJc6iOq2xCPGCIYbpCxOlaR27r82aA5+zMQodITP0QwvLXxqtgGzgD3itqNXlcU1AOpBRnL91Tk1k4l4j+h7AeROX4eRsz49o+nZ4yqhDfmbi/jFYPEqVkQ2erHhRKslu6uyDLFhmRVXAltIEkcSBAiW8h2c34eJo7MVHfYE+PPRXnjBX0jCxHHr418PTuLDYQ68FhvaP4VkIjjm0hUgSeZurkkIQ6CLoGW/YIRoQMYJGd6cHhSiLjVkCTTubJQS2ad9TB2O5n71A2jx0R6p4FWnyq6JJdB1QpssbhfbxX7cV5O8F47Mk5DiYxeX7QliHb3G/UKiBajf2Fc2kTrxg2C6LNjUsGlAUxAfEZRDToZD4YqNGLgCX9bkKuBwIEpSoslabSAgPXBtIys0HSCtL7WwczxG4r2lMSOPWq3l5D9ksZPrbUGv0tL0femZqgfiAG1pCNkDfYE0Y6p3M/sK6zeDETA2AogtpDxkrG6AXjgJHDjJKLGLmrFm75L3b6mHrlJ0xSSOQIWBk99vUS9VzGgauXKLjUM69RLYpeiyXfzgTyLrBddJnHclKpKuuQigUCDIErt/smMjNxAA6M+EuDffS2hAzuM1ygStjT+7ckZocOxN+8/frhGAkiO+EPJXJ8ULO0gADPV/V+7iyEELPpT383NCek2RdD2TFUgRwFFpUi9QgE2bUtJ/tGOy6sT09hSbV1FS4OOVpBXy/QCPy1TDgRwwbhNylnIUbdTfJGP3dFFM++AtihzG4fV+uLPtzaxaRAHaWJHPXq55uBhgCvve7rtxtOyp3XfW68VFF9FWvee2C0RwGUKlyq9jARSbrdc9FjuD3vZ1Rv3iDVfhiKZo30ZiiQCXoZ6qBk2c3RusXLYRM3X0x4O4F6Law4Da/BOGHZYn3AQNBMhf8LxC3GCPUP9qMakM/1C+KjmX8VVROye/sypyZQAU+v4zGmqWaPpwDvB8IhYVI77CVr7pmzup5il2KLIKhyDrPnZLJrOPBtlTktjPjz7D7yxMv2+SAj+AAAAAElFTkSuQmCC');
}
.share-ct .share-ct-inner a.reddit {
    background-color: #ff4500;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAEjklEQVR4Ae1YA7QrSRB9b23btm1lvm3btm3btm3btm3bf27V7J03i5xkkmec3fQZVt+uvumuqlRNmJUsKR7/UVohWiFaIVpGYLknkWhpmvs1wyOa/A7rjzAepOIQ0hR3S97XUfBdTfMAXxOUliYPx6D6snM15g5B7xqokQJ5XtO090uGRzCihZw8KOdOYN4wyfMqmSUULS4Jp9+6DHs3Yt1cm8TFM3JiPzbMx6rpevum9XfDxK6a/M6EouUJQ6H35cxRtC2kKbllr0nV39C5DGYOkLPHLK8m21dqxkctI2Fo/RGGhlm4Qij/g2NVjnkp6Q5p7E0LyyZp6vsScLUGNZQjuyXHC+TkLZcCb2PzYkuVnOTYXlQzKEwgWpriTiweg+WTuYP+Zic5X0KbIuhcTop8aCULTyhP5MRZnsb+LRja2G0l/t3TKIauuNvB0l/LhdNomoNzJ4Eob0Qcv4WhVQE5fxLFPnXsPZFoeewdYfiR9A9LzheQ73VM7YUju8xSX0mO5ylkl7Nl8UPL4OFrIpr2QZT8HF3KYfZgbFkiR3YyXOnNa3r7Fh/4SiG7CCCMYN/1M3jEmBajthEu6R+RjI9r8rv4u3lIlqfQKj9Wz9CLp22HD95UCSMYLfNL5qccDVxFKqRaNe6wjOjSclx6cCPZukx2rsGUXij7DepnxJalat6yotk4xF6/+hlQ5htzSk8qpFrGWMn1ciBmAThlfx6rpnmrpjnrtUtWLJpevUQl3hJZPYOG6MosgLf3qGTvUXw3VbNnFVe3CBCvF40Jpg0mUxS9eMZSCQwSAgizYAZRhcXjOF0c0NLzJ9CtIgq8g2KfYHRbvXndH0Mhu2xAgXcJ5pA4oBV8E9Gvtnr+jlup7mda54KZO4xdTtwimEPiYBNdTd5peu0yyv3479/L7wzuBX1/gCojPrscDMEc4uouWD2dE1lGtAJEjhexdIIvrVs3UDut95Rmz6ou81HoRZ1DONAHQ+WMQcEDhPtWyshWHO+iLttzTjqA4p/Kvk3+GArZ5WAI5hAXPSNaOtSjTQvDmlr+TSBblmJAXQxvLod2WAEauwggjGBLxIUWU1ZPDGj9YScFKhIvAUvEbJEvhqvFZFdOHIgPWqyIpMBbMVktHqxCMbaDu16G00tnI1mSS+fk3HHXLoxpT+UxTWy4YPnekj0b/KL8bbNtYVT5HRvmMZ9xC6fX7PKw6h9m60Jq3vbltGe95HszeCoWhWy4uqEnD/qFnBm2G2Z8wibXszIm98CicTz4YL9W/V0yPYHin7Bw9V3mkwdQzRMXlY8RxrJdDm7zXZLThzGlJ+qmRcG3GAUk89M8wIcCb6FOWvKT04d9OR3YiurJ4u4bBNes6EdYMMp/y1jFs2iWg1uZRfHgxHyl0GVb549EkQ/juvLxROTKjbNh7Wy9ftmKciOYQ9A4K4fHz4ckI4Jc+odpHPRQ2bZcL5xSmK6Zj54/JduWEUYwh9iEjHitfJwqwwjn5w17Z+tnYurCkC2j2/DgA18pZBcBhMWsPotdhejxqpUNN0no22mIVohWiNb/hdafirEXE+rApJcAAAAASUVORK5CYII=');
}

#seeAlsoPanelContainer_AMP_content_0 {
	margin-top:15px;
}

.sa-ancr-wrp{
	float: left;
	width: calc(100% - 47px);
	padding: 0;
	background: #fbfbfb;
    margin: 15px 15px 0px 15px;
	border: 1px solid rgba(0,0,0,0.1);
	border-radius: 2px 2px 0 0;
	padding-right: 15px;
}


.sa-ancr-wrp:last-child {
	border-bottom:1px solid rgba(0,0,0,0.1);
	margin-bottom: 10px;
}

.sa-ancr-wrp .seealso-spacer{
    margin: 10px 0px;
    float: left;
    width: 100%;
    border-bottom: 1px solid #e6e6e6;
}


.sa-ancr-wrp amp-img{
    width: 80px;
	float: left;
	margin-right: 15px;
}


.sa-ancr-wrp amp-anim{
    width: 80px;
	float: left;
	margin-right: 15px;
}


.sa-ancr-wrp img{
    object-fit: cover;
    width:80px;
    float:left;
}

.sa-ancr-wrp .sa-contentwrap {
	position: relative;
	top: 50%;
    width: calc(100% - 100px);
	-webkit-transform: translateY(-50%);
	-ms-transform: translateY(-50%);
	transform: translateY(50%);
	height: 40px;
	font-family: "Poppins", Helvetica, Arial;
    float: left;
}

.sa-ancr-wrp .sa-title{
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

.sa-ancr-wrp .sa-blurb {
	float: left;
	width: 100%;
	color: #888888;
	font-size: 0.8em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-top: 2px;
    text-align: left;
}
.sa-ancr-wrp .sa-blurb p {
    margin: 3px 0px;
}

.sa-ancr-wrp .sa-noimg {
	background:url("https://epcdn-vz.azureedge.net/static/images/no-image-slide.png");
	background-size: cover;
	height: 80px;
	width: 80px;
	float: left;
	margin-right: 15px;
	border-right: 1px solid rgba(0,0,0,0.1);
}


.noresize{
    overflow-x: scroll ;
}

</style>
`;
