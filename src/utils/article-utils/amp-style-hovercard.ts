export const styleNugget = `
<style>

/* latin */
@font-face {
  font-family: 'Libre Baskerville';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('Libre Baskerville Bold'), local('LibreBaskerville-Bold'), url(https://fonts.gstatic.com/s/librebaskerville/v7/kmKiZrc3Hgbbcjq75U4uslyuy4kn0qviTgY3KcA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
    
html {
	float: left;
	width: 100%;
	height: 100%;
}

body {
	float: left;
	width: 100%;
	height: 100%;
	overflow: hidden;
	margin: 0;
	font-family: 'OpenSans', 'Open Sans', sans-serif;
	font-size: 14px;
	line-height: 1.6;
	color: #333;
	background-color: #FFF;
}

a {
	color: #3097d1;
	text-decoration: none;
}

img {
	vertical-align: middle;
}

hr,
img {
	border: 0;
}

#hoverblurb_AJAX {
	height: 100%;
	width: 100%;
	font-family: 'OpenSans', 'Open Sans', sans-serif;
	background: white;
}

#hoverblurb_AJAX .main-content-block {
	float: left;
	display: block;
	width: 100%;
	height: 100%;
	margin: 0px;
}

.ad-container-hovercard-full-width {
	width: 100%;
	height: 50px;
	text-align: center;
}

.ad-top-spacer {
	border-top: 1px solid rgba(0, 0, 0, 0.35);
	padding-bottom: 5px;
}

.ad-dual-spacer {
	margin: 5px 0px;
	border-bottom: 1px solid #e6e6e6;
}

#hoverblurb_AJAX .close-hc {
	height: auto;
	width: auto;
	position: absolute;
	top: 2px;
	right: 2px;
	z-index: 99999;
	color: #FFF;
}

#hoverblurb_AJAX .icon-cross:before {
	content: "\EA77";
	font-size: 26px;
	text-shadow: 0px 0px 3px rgba(0, 0, 0, 1);
}

#hoverblurb_AJAX .hvrblrb-ajax-picture {
	width: 100%;
	max-height: 50%;
	overflow: hidden;
	float: left;
	padding: 0px;
	text-align: center;
}

#hoverblurb_AJAX .hvrblrb-ajax-picture a.pic-block {
	width: 100%;
	float: left;
	padding: 0px;
	text-align: center;
}

#hoverblurb_AJAX .hvrblrb-ajax-picture a.pic-block img {
	width: 100%;
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb {
	width: calc(100% - 30px);
	line-height: 1.25;
	overflow: hidden;
	display: block;
	font-size: 15px;
	padding: 5px 15px 0px 15px;
	height: 45%;
	z-index: 9999;
	position: relative;
	background: rgba(255, 255, 255, .925);
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb.hvrblrb-no-photo {
	height: 95%;
}

#hoverblurb_AJAX .goto-btn {
	background: #303030;
	width: 100%;
	float: left;
	text-align: center;
	color: #FFF;
	text-decoration: none;
	padding-top: 8px;
	padding-bottom: 7px;
	text-transform: uppercase;
	bottom: 0px;
	left: 0px;
	position: absolute;
	z-index: 99999;
	font-size: 13px;
}

#hoverblurb_AJAX .goto-btn:before {
	background: -webkit-linear-gradient(rgba(0, 0, 0, 0), #303030);
	/* For Safari 5.1 to 6.0 */
	background: -o-linear-gradient(rgba(0, 0, 0, 0), #303030);
	/* For Opera 11.1 to 12.0 */
	background: -moz-linear-gradient(rgba(0, 0, 0, 0), #303030);
	/* For Firefox 3.6 to 15 */
	background: linear-gradient(rgba(0, 0, 0, 0), #303030);
	/* Standard syntax */
	content: " ";
	display: block;
	position: absolute;
	left: 0;
	top: -5px;
	width: 100%;
	height: 5px;
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb a:hover {
	text-decoration: none
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb .name-block {
	font-weight: 600;
	font-size: 18px;
	display: block;
	margin-bottom: 8px;
	width: 100%;
	border-bottom: 0px;
	float: left;
	text-align: left;
	word-break: break-all;
    margin-top: 8px;
    color: #2273dd;
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb .name-block img.verified-page-logo {
	position: relative;
	top: -8px;
	left: -3px;
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb .name-block.cls-newlink {
	font-size: 14px;
}

#hoverblurb_AJAX .hvrlnk-cite-container {
	width: 100%;
	display: inline-block;
}

#hoverblurb_AJAX .hvrlnk-cite-avatar-container {
	float: left;
}

#hoverblurb_AJAX .hvrlnk-cite-avatar-container img.hvrlnk-cite-avatar {
	border-radius: 20px;
	object-fit: cover;
	margin: 5px 15px 5px 0px;
}

#hoverblurb_AJAX .hvrlnk-cite-avatar-extras-container {
	float: left;
	width: calc(100% - 85px);
}

#hoverblurb_AJAX .hvrlnk-cite-container .hvrlnk-cite-avatar-extras-container .hvrlnk-cite {
	margin-bottom: 2px;
	color: #544e52;
	font-size: 13px;
}

#hoverblurb_AJAX .hvrlnk-cite-container .hvrlnk-cite-avatar-extras-container .hvrlnk-cite .hvrlnk-label {
	font-weight: bold;
}

#hoverblurb_AJAX .hvrlnk-cite-container .hvrlnk-cite-avatar-extras-container .hvrlnk-cite a {
	text-decoration: none;
	color: #52a3d3;
}


#hoverblurb_AJAX .hvrblrb-ajax-blurb .description-block {
	display: block;
	text-align: left;
	cursor: pointer;
	height: 100%;
	width: 100%;
	float: left;
	font-style: normal;
    font-size: 15px;
    color: #6c6c6c;
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb .description-block a {
	color: #000000;
}

#hoverblurb_AJAX .hvrblrb-ajax-blurb .description-block p {
	margin: 0px;
	padding: 0px;
	color: #444;
}

.icon-export:before {
	content: "\EA96";
}

.icon:before {
	top: 2px;
	display: inline-block;
	font-family: toolkit-entypo;
	speak: none;
	font-size: 100%;
	font-style: normal;
	font-weight: 400;
	font-variant: normal;
	text-transform: none;
	line-height: 1;
	-webkit-font-smoothing: antialiased;
}

.checkbox-inline,
.icon:before,
.radio-inline {
	position: relative;
}
  
</style>
`;
