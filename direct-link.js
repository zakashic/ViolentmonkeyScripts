// ==UserScript==
// @name         Direct Link
// @namespace    https://github.com/zakashic/ViolentmonkeyScripts
// @version            0.3.3
// @description  Replace redirect links with direct links
// @author       zakashic
// @match        *://*.youtube.com/*
// @match        *://*.zhihu.com/*
// @match        *://*.steampowered.com/*
// @match        *://*.steamcommunity.com/*
// @match        *://*.pixiv.net/*
// @match        *://*.vk.com/*
// @match        *://*.hoyolab.com/*
// @match        *://*.jianshu.com/*
// @match        *://*.juejin.cn/*
// @match        *://*.epicgames.com/*
// @match        *://*.mozilla.org/*
// @match        *://*.firefox.com/*
// @match        *://*.leetcode.cn/*
// @match        *://*.oschina.net/*
// @match        *://*.gitee.com/*
// @match        *://*.xda-developers.com/*
// @match        *://*.sspai.com/*
// @match        *://*.gcores.com/*
// @match        *://*.deviantart.com/*
// @match        *://union-click.jd.com/*
// @match        *://*.tmall.com/*
// @match        *://s.click.taobao.com/*
// @match        *://s.click.tmall.com/*
// @match        *://wiki.biligame.com/*
// @match        *://*.linkstars.com/*
// @match        *://tieba.baidu.com/*
// @match        *://ala.baidu.com/*
// @match        *://*.linkedin.com/*
// @match        *://*.theverge.com/*
// @match        *://*.douban.com/*
// @match        *://sourceforge.net/*
// @icon               https://raw.githubusercontent.com/zakashic/ViolentmonkeyScripts/main/src/direct-link.png
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @sandbox      JavaScript
// @license      MIT
// ==/UserScript==

/*
## Main features
- Replace redirect links with direct links
- Clean SourceForge tracking links
- Additional features via script menu

## Currently supported sites
- youtube.com
- epicgames.com
- mozilla.org / firefox.com (adjust.com)
- hoyolab.com (adjust.com)
- juejin.cn
- leetcode.cn
- oschina.net
- gitee.com
- xda-developers.com
- sspai.com
- gcores.com
- zhihu.com
- Steam (Store, Hub)
- pixiv.net
- vk.com
- deviantart.com
- tmall.com (goto)
- linkstars.com (Prevent redirection)
- union-click.jd.com (Prevent redirection)
- s.click.(tmall|taobao).com (Prevent redirection)
- wiki.biligame.com
- tieba.baidu.com
- linkedin.com
- sourceforge.net
*/

(() => {
  const DELAY_TIME = { fast: 600, normal: 1000, slow: 2500 };
  let topScroll = 0;
  const INDEX_TARGET = ['target'];
  const INDEX_ADJUST = ['redirect', 'fallback'];
  const INDEX_URL = ['url'];
  const INDEX_TO = ['to'];
  const INDEX_Q = ['q'];
  const INDEX_GOTO = ['goto'];
  const regStr = '(youtube|steamcommunity|zhihu|jianshu|juejin|leetcode|'
        + 'oschina|gitee|sspai|gcores|alipay|epicgames|linkedin|vk|adjust|'
        + 'game.bilibili|douban|sourceforge).(com|net|cn|hk)$';
  let hostRegex = new RegExp(regStr);
  const pageHost = window.location.hostname;
  const pageParams = window.location.search;
  const doc = document;

  // SourceForge link cleaning function
  function cleanSourceForgeLink(originalLink) {
    try {
      const url = new URL(originalLink);
      const oaparams = new URLSearchParams(url.search).get('oaparams');
      if (!oaparams) return originalLink;

      const oaComponents = oaparams.split('__');
      const oadestComponent = oaComponents.find((comp) => comp.startsWith('oadest='));
      if (!oadestComponent) return originalLink;

      const destUrlEncoded = oadestComponent.split('oadest=')[1];
      const destUrl = decodeURIComponent(destUrlEncoded);
      const finalUrl = new URL(destUrl);

      return finalUrl.origin + finalUrl.pathname.replace(/\/$/, '');
    } catch (e) {
      console.error('Error cleaning SourceForge URL:', e);
      return originalLink;
    }
  }

  let linkDirect;
  switch (true) {
    case /(pixiv.net|deviantart.com)$/.test(pageHost):
      hostRegex = /(pixiv.net|deviantart.com)$/;
      linkDirect = (directURLParams, delayTime) => {
        if (linkDirect.timeoutID) clearTimeout(linkDirect.timeoutID);
        linkDirect.timeoutID = setTimeout(() => {
          const links = doc.getElementsByTagName('a');
          for (let i = 0; i < links.length; i += 1) {
            if (hostRegex.test(links[i].hostname)) {
              const params = new URLSearchParams(links[i].search);
              directURLParams.forEach((k) => {
                if (params.has(k) && links[i].href !== decodeURIComponent(params.get(k))) {
                  links[i].href = decodeURIComponent(params.get(k));
                }
              });
              if (/jump.php|outgoing/.test(links[i].pathname)) {
                if (links[i].href !== decodeURIComponent(links[i].search.substring(1))) {
                  links[i].href = decodeURIComponent(links[i].search.substring(1));
                }
              }
            }
          }
          linkDirect.timeoutID = null;
        }, delayTime);
      };
      break;
    case /xda-developers.com$/.test(pageHost):
      hostRegex = /(xda-developers.com|shop-links.co|anrdoezrs.net|a9yw.net|pxf.io|viglink.com|awin1.com)$/;
      linkDirect = (directURLParams, delayTime) => {
        if (linkDirect.timeoutID) clearTimeout(linkDirect.timeoutID);
        linkDirect.timeoutID = setTimeout(() => {
          const links = doc.getElementsByTagName('a');
          for (let i = 0; i < links.length; i += 1) {
            if (hostRegex.test(links[i].hostname)) {
              const params = new URLSearchParams(links[i].search);
              directURLParams.forEach((k) => {
                if (params.has(k) && links[i].href !== decodeURIComponent(params.get(k))) {
                  links[i].href = decodeURIComponent(params.get(k));
                }
              });
              let realLink = links[i].href;
              if (/https?/.test(links[i].search)) {
                realLink = links[i].search.substring(1);
              } else if (/https?/.test(links[i].pathname)) {
                realLink = links[i].pathname.substring(links[i].pathname.lastIndexOf('http'));
              }
              if (links[i].href !== decodeURIComponent(realLink)) {
                links[i].href = decodeURIComponent(realLink);
              }
            }
          }
          linkDirect.timeoutID = null;
        }, delayTime);
      };
      break;
    case /^(tieba|ala).baidu.com$/.test(pageHost):
      linkDirect = (directURLParams, delayTime) => {
        if (linkDirect.timeoutID) clearTimeout(linkDirect.timeoutID);
        linkDirect.timeoutID = setTimeout(() => {
          const links = doc.getElementsByClassName('j-no-opener-url');
          for (let i = 0; i < links.length; i += 1) {
            if (/^jump2?.bdimg.com$/.test(links[i].hostname) && links[i].innerText.startsWith('http')) {
              links[i].href = links[i].innerText;
            }
          }
          linkDirect.timeoutID = null;
        }, delayTime);
      };
      break;
    case /sourceforge.net$/.test(pageHost):
      linkDirect = (directURLParams, delayTime) => {
        if (linkDirect.timeoutID) clearTimeout(linkDirect.timeoutID);
        linkDirect.timeoutID = setTimeout(() => {
          const links = doc.getElementsByTagName('a');
          for (let i = 0; i < links.length; i += 1) {
            if (/sourceforge.net$/.test(links[i].hostname)) {
              const cleanedLink = cleanSourceForgeLink(links[i].href);
              if (links[i].href !== cleanedLink) {
                links[i].href = cleanedLink;
              }
            }
          }
          linkDirect.timeoutID = null;
        }, delayTime);
      };
      break;
    default:
      linkDirect = (directURLParams, delayTime) => {
        if (linkDirect.timeoutID) clearTimeout(linkDirect.timeoutID);
        linkDirect.timeoutID = setTimeout(() => {
          const links = doc.getElementsByTagName('a');
          for (let i = 0; i < links.length; i += 1) {
            if (hostRegex.test(links[i].hostname)) {
              const params = new URLSearchParams(links[i].search);
              directURLParams.forEach((k) => {
                if (params.has(k) && links[i].href !== params.get(k)) {
                  links[i].href = params.get(k);
                }
              });
            }
          }
          linkDirect.timeoutID = null;
        }, delayTime);
      };
      break;
  }

  // Youtube additional steps
  function youtubeDirect() {
    function run(delayTime) {
      linkDirect(INDEX_Q, DELAY_TIME.fast);
      linkDirect(INDEX_Q, DELAY_TIME.normal * 2);
      const timeoutID = setTimeout(() => {
        linkDirect(INDEX_Q, 0);
        document.addEventListener('click', () => {
          linkDirect(INDEX_Q, DELAY_TIME.fast);
        });
        clearTimeout(timeoutID);
      }, delayTime);
    }
    run(2000);
    doc.addEventListener('DOMContentLoaded', () => {
      run(1000);
    });
    doc.onvisibilitychange = () => {
      run(1500);
    };
  }

  // Main function
  (() => {
    let indexParam;
    let MenuTitle;
    const lang = navigator.language || '';
    if (lang.startsWith('zh-TW') || lang.startsWith('zh-HK')) {
      MenuTitle = '手動再次替換';
    } else if (lang.startsWith('zh')) {
      MenuTitle = '手动重新替换';
    } else {
      MenuTitle = 'Retry link replacing.';
    }

    const adjust = /(hoyolab|mozilla|firefox)\.(com|org)$/.test(pageHost);
    const usingTarget = /(juejin|leetcode|gitee|sspai|gcores|zhihu)\.(com|cn)$/.test(pageHost);
    const isSourceForge = /sourceforge.net$/.test(pageHost);
    const urlParam = new URLSearchParams(pageParams);
    switch (true) {
      case usingTarget:
        indexParam = INDEX_TARGET;
        break;
      case adjust:
        indexParam = INDEX_ADJUST;
        linkDirect(indexParam, DELAY_TIME.normal * 2);
        break;
      case pageHost.endsWith('youtube.com'):
        indexParam = INDEX_Q;
        youtubeDirect();
        break;
      case /(s.click.taobao.com|tmall.com)$/.test(pageHost):
        indexParam = INDEX_GOTO;
        if (/^s.click.(tmall|taobao).com$/.test(window.location.hostname)
                    && new URLSearchParams(pageParams).has('tar')) {
          window.stop();
          const targetLink = decodeURIComponent(new URLSearchParams(window.location.search).get('tar'));
          if (/^https?:\/\//.test(targetLink)) {
            window.location.replace(targetLink);
          }
        }
        break;
      case isSourceForge:
        linkDirect([], DELAY_TIME.normal);
        break;
      case /(steampowered|steamcommunity|wiki.biligame|linkedin|douban).com$|pixiv.net$/.test(pageHost):
        indexParam = INDEX_URL;
        break;
      case /(vk|jianshu).com$/.test(pageHost):
        indexParam = INDEX_TO;
        break;
      case pageHost.endsWith('epicgames.com'):
        indexParam = ['redirectTo'];
        break;
      case pageHost.endsWith('oschina.net'):
        indexParam = [...INDEX_URL, 'goto_page'];
        break;
      case pageHost.endsWith('xda-developers.com'):
        indexParam = [...INDEX_URL, 'u', 'ued', 'referer'];
        break;
      case /(union-click.jd.com|www.linkstars.com)$/.test(pageHost):
        indexParam = INDEX_TO;
        for (const k of indexParam) {
          if (urlParam.has(k) && /^https?/.test(urlParam.get(k))) {
            window.stop();
            window.location.href = decodeURIComponent(urlParam.get(k));
            break;
          }
        }
        break;
      case /(theverge.com|7tiv.net)$/.test(pageHost):
        hostRegex = /sjv.io$/;
        indexParam = [...INDEX_URL, 'u'];
        if (pageHost.endsWith('7tiv.net')) {
          const params = new URLSearchParams(pageParams);
          for (const k of indexParam) {
            if (params.has(k) && /^https?/.test(params.get(k))) {
              window.stop();
              window.location.href = decodeURIComponent(params.get(k));
              break;
            }
          }
        }
        break;
      default:
        indexParam = [''];
        break;
    }

    doc.addEventListener('DOMContentLoaded', () => {
      linkDirect(indexParam, DELAY_TIME.normal);
    }); // eslint-disable-next-line no-undef
    GM_registerMenuCommand(
      MenuTitle,
      () => { linkDirect(indexParam, 0); },
      'D',
    );

    window.onscroll = () => {
      const scrolls = doc.documentElement.scrollTop;
      if (scrolls <= 200) {
        linkDirect(indexParam, 0);
        topScroll = scrolls;
      }
      if (scrolls - topScroll > 100 && scrolls > 200) {
        linkDirect(indexParam, 0);
        topScroll = scrolls;
      }
    };
  })();
})();

/*
v0.3.1 2026.09.07
- Optimized performance with debounced scroll handlers.
- Updated metadata and high-definition icon.

v0.3.0 2026.09.07
- Fixed language detection, resolved array mutation bugs.
- Optimized performance and error handling.
- Maintained all existing features with DS.

v0.2.3 2023.08.15
- Add a alternate host `ala.baidu.com`, same as `tieba.baidu.com`.
- Fix an error when decoding the URLs on the Chinese pages of youtube.com.

v0.2.2 2023.07.02
- Performance improvements and issue fixes.

v0.2.1 2023.06.07  
- Fix an issue where the replacements weren't active on `deviantart.com`, which is missing on `siteRegex`.
- Fix most timeout issues.
- Minor issue fixes and optimisations .

v0.2.0  2023.06.02  
- Improve replacing efficiency on youtube.
- Replacing more links on xda (a9yw.net|pxf.io), tieba.baidu.com (jump.baidu.com), linkedin.com.
- Prevent redirection on `s.click.tmall.com` (beta).
- Code reduction and other improvements.

v0.1.9 2023.05.24  
- Directing for wiki.biligame.com, www.linkstars.com.
- Performance optimisation and bug fixes.

v0.1.8 2023.05.18  
- Directing for JD.com, Tmall.com.
- Improve replacing efficiency on youtube.

v0.1.7 2023.05.15  
- Replace more redirecting links for xda-developers(vglink.com anrdoezrs.net).
- Add a index param for shop-links.co.
- Direc links for `Steam store and hub`, `Pixiv.net`.
- Optimise regexps matching.

v0.1.6.1 2023.05.10  
- Fix an issue where has an undefined function, which may cause some functions to fail to execute.

v0.1.6 2023.05.10  
- Add support for sspai|gcores|zhihu.com (target).
- Add another redirecting index param for oschina.net.
- Remove landiannews.com for its low usage.

v0.1.5 2023.05.05  
- Errors fixes and code reduction.
- Replacing the shop-links with direct links on **xda-developers.com**.

v0.1.4 2023.04.28  
- Expand effecting area.
- Several optimisation.
- More url index for adjust.

v0.1.3 2023.04.18  
- Improve effecting stability.
- Apply direct link for mozilla.org, firefox.com (Adjust.com - redirect),
- Apply direct link for leetcode.cn, oschina.net, gitee.com (target).
- Add a script submenu to the tampermonky menu, which for the function of manually replacing with direct links.

v0.1.2 2023.04.15  
- Optimised link directing on youtube.com.
- Performance optimisation.

v0.1.1 2023.04.06  
- Spelling correction.

v0.1.0 2023.04.06  
- Script optimisation.
- Fix youtube matching.

v0.0.6  2023.03.27  
Replace direct url on Epicgames.com.

v0.0.5  
- Remove [Youtube.com] event redirection.

v0.0.4 2023.02.24  
- Added [Juejin.cn] redirecting.

v0.0.3 2023.01.25  
- Added [Jianshu.com] redirecting.

v0.0.2 2023.01.06  
- Clean Hoyolab [app.adjust.com] tracking urls.

v0.0.1 2022.12.27  
- Initial release, direct link for landiannews.com.
*/
