/**
 * Run a function with arguments passed in from popup via main.
 */
self.port.on('message', function(data) {
  window['AemDeveloper'][data.method].apply(null, data.args);
});

/**
 * AemDeveloper namespace.
 * @namespace
 */
var AemDeveloper = (function(window, undefined) {
  /**
   * @private
   * @global
   */
  var CLIENTLIB_QUERY         = '/crx/de/query.jsp?type=xpath&stmt=/jcr:root/var/clientlibs/*&showResults=true',
      COMPILED_JSP_QUERY      = '/crx/de/query.jsp?type=xpath&stmt=/jcr:root/var/classes//jsp&showResults=true',
      LINKCHECKER_QUERY       = '/crx/de/query.jsp?type=xpath&stmt=/jcr:root/var/linkchecker/*&showResults=true',
      ACTIVATE_TREE           = '/etc/replication/treeactivation.html',
      ACTIVATE_PAGE           = '/bin/replicate.json',
      AUTH_LOG_OUT            = '/crx/de/logout.jsp',
      AUTH_LOG_IN             = '/crx/de/j_security_check',
      USER_INFO               = '/libs/granite/security/currentuser.json'
      PRODUCT_INFO            = '/libs/cq/core/productinfo.json',
      SLING_INFO              = '/system/console/status-slingsettings.json',
      SYSTEM_INFO             = '/system/console/status-System%20Properties.json',
      HOTFIX_INFO             = '/crx/packmgr/service.jsp?cmd=ls',
      SUDOABLE_INFO           = '.sudoables.json',
      MEMORY_USAGE            = '/system/console/memoryusage',
      COMPARE_CONTAINER_NAME  = 'aem-developer-chrome-diff',
      TITLE_BAR_CLASS_NAME    = 'titlebar',
      COMPARE_BAR_CLASS_NAME  = 'comparebar',
      CONTAINER_CLASS_NAME    = 'container',
      SELF_VIEW_CLASS_NAME    = 'self_view',
      COMPARE_TEXT            = 'Compare',
      VIEW_TEXT               = 'View',
      TITLE_CLASS_NAME        = 'title',
      TOGGLE_CLASS_NAME       = 'toggle',
      TOGGLE_HIDE_ALL_TEXT    = 'Show Difference',
      TOGGLE_SHOW_ALL_TEXT    = 'Show All',
      CLOSE_CLASS_NAME        = 'close',
      CLOSE_TITLE_TEXT        = 'Close compare modal';

  /**
   * Open the marketing cloud debugger window.
   */
  function openDigitalPulseDebugger() {
    var dp_debugger = window.open("","dp_debugger","width=700,height=1000,location=0,menubar=0,status=1,toolbar=0,resizable=1,scrollbars=1");
    dp_debugger.document.write("<script language=\"JavaScript\" id=dbg src=\"https://www.adobetag.com/d1/digitalpulsedebugger/live/DPD.js\"></"+"script>");
    dp_debugger.focus();

    sendMessage({
      type: 'dp_debugger',
      status: 'success'
    });
  }

  /**
   * Communicate with main.
   */
  function sendMessage(data) {
    self.port.emit('message', data);
  }

  /**
   * Close panel via main.
   */
  function closePanel() {
    self.port.emit('closePanel');
  }

  /**
   * Get a non-caching URL.
   *
   * @private
   * @param {String} url The URL to modify
   * @returns {String} The modified URL.
   */
  function getNonCachingUrl(url) {
    var separator = url.indexOf('?') === -1 ? '?' : '&';
    
    return url + separator + '_=' + Date.now();
  }

  /**
   * Delete the results of the query and post a message with status.
   *
   * @private
   * @param {String} query the URL with query to the JCR.
   */
  function deleteQueryResults(type, query) {
    var succesLength = 0;

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200) {
          var data = JSON.parse(xmlhttp.responseText),
              resultLength = data.results.length;

          if (resultLength > 0) {
            for (var i = 0; i < resultLength; i++) {

              (function(){
                var xmlhttpInner = new XMLHttpRequest();

                xmlhttpInner.onreadystatechange = function() {
                  if (xmlhttpInner.readyState === 4) {
                    if (xmlhttpInner.status === 200 || xmlhttpInner.status === 204) {
                      succesLength++;

                      if (resultLength === succesLength) {
                        sendMessage({
                          type: type,
                          status: 'success'
                        });
                      } //end if success
                    } else {
                      sendMessage({
                        type: type,
                        status: 'fail'
                      });
                    } // end if/else status
                  } //end ready state
                };

                xmlhttpInner.open('DELETE', data.results[i].path, true);
                xmlhttpInner.send();
              })();
            }
          } else {
            sendMessage({
              type: type,
              status: 'noaction'
            });
          }
        } else {
          sendMessage({
            type: type,
            status: 'fail'
          });
        } //end if/else status code
      } //end readystate
    };

    xmlhttp.open('GET', getNonCachingUrl(query), true);
    xmlhttp.send();
  }

  /**
   * Delete cached client libs.
   */
  function clearClientLibs() {
    deleteQueryResults('clientlibs', CLIENTLIB_QUERY);
  }

  /**
   * Delete compiled JSP files.
   */
  function clearCompiledJSPs() {
    deleteQueryResults('compiled_jsps', COMPILED_JSP_QUERY);
  }

  /**
   * Delete cached linkchecker results.
   */
  function clearLinkChecker() {
    deleteQueryResults('linkChecker', LINKCHECKER_QUERY);
  }

  /**
   * Get window title and location.
   */
  function getWindowInfo() {
    sendMessage({
      type : 'window',
      data : {
        'title': document.title,
        'location': {
          hash: window.location.hash,
          host: window.location.host,
          hostname: window.location.hostname,
          href: window.location.href,
          origin: window.location.origin,
          pathname: window.location.pathname,
          port: window.location.port,
          protocol: window.location.protocol,
          search: window.location.search
        }
      }
    });
  }

  /**
   * Get info and send a Chrome message.
   *
   * @private
   * @param {String} Type of message to send.
   * @param {String} URL to query the JCR.
   * @param {Function} Callback function.
   * @param {Boolean} preventSuccessMessage  
   */
  function getInfo(type, url, callback, preventSuccessMessage) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      var data;

      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200) {

          if (!preventSuccessMessage) {
            data = JSON.parse(xmlhttp.responseText);

            sendMessage({
              type: type,
              status: 'success',
              data: data
            });
          } else {
            data = xmlhttp.responseText;
          }

          if (callback) {
            callback(data);
          }
        } else {
          sendMessage({
            type: type,
            status: 'fail'
          });
        }
      }
    };

    xmlhttp.open('GET', getNonCachingUrl(url), true);
    xmlhttp.send();
  }

  /**
   * Post to AEM
   *
   * @private
   * @param {String} Type of message to send.
   * @param {String} URL to post to the JCR.
   * @param {String} parameters for the post request.
   * @param {Function} Callback function.
   */
  function post(type, url, params, callback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200) {
          sendMessage({
            type: type,
            status: 'success'
          });
          
          if (callback) {
            callback(xmlhttp);
          }

        } else {
          sendMessage({
            type: type,
            status: 'fail'
          });
        }
      }
    };

    xmlhttp.open('POST', url, true);
    xmlhttp.setRequestHeader('Content-type','application/x-www-form-urlencoded');
    xmlhttp.send(params);
  }

  /**
   * Activate Tree starting at current page.
   *
   * @param {String} pathname
   */
  function activateTree(pathname) {
    post('activateTree', ACTIVATE_TREE, 'cmd=activate&ignoredeactivated=false&onlymodified=false&path=' + encodeURIComponent(pathname) + '&_charset_=utf-8');
  }

  /**
   * Activate current page.
   *
   * @param {String} pathname
   */
  function activatePage(pathname) {
    post('activatePage', ACTIVATE_PAGE, 'cmd=activate&path=' + pathname + '&_charset_=utf-8');
  }

  /**
   * Deactivate current page.
   *
   * @param {String} pathname
   */
  function deactivatePage(pathname) {
    post('deactivatePage', ACTIVATE_PAGE, 'cmd=deactivate&path=' + pathname + '&_charset_=utf-8');
  }

  /**
   * Log out of AEM and refresh the browser.
   */
  function logOut() {
    getInfo('logout', AUTH_LOG_OUT, function(){
      closePanel();
      location.reload();
    });
  }

  /**
   * Log into AEM.
   *
   * @param {String} user The user name
   * @param {String} pass The password
   */
  function logIn(user, pass) {
    var params = 'j_username=' + user + '&j_password=' + pass + '&j_workspace=crx.default&j_validate=true&_charset_=utf-8';

    post('login', AUTH_LOG_IN, params, function(){
      closePanel();
      location.reload();
    });
  }

  /**
   * Get list of users that can be impersonated.
   *
   * @param {String} Path to user e.g. '/home/users/a/admin'
   */
  function getSudoables(home) {
    getInfo('sudoables', home + SUDOABLE_INFO);
  }

  /**
   * Get all info.
   */
  function getAllInfo() {
    getProductInfo();
    getHotfixes();
    getSlingInfo();
    getSystemInfo();
  }

  /**
   * Get user info.
   */
  function getUserInfo() {
    getInfo('user', USER_INFO, function(data){
      getSudoables(data.home);
    });
  }

  /**
   * Get product info.
   */
  function getProductInfo() {
    getInfo('product', PRODUCT_INFO);
  }

  /**
   * Get Sling info.
   */
  function getSlingInfo() {
    getInfo('sling', SLING_INFO);
  }

  /**
   * Get System info.
   */
  function getSystemInfo() {
    getInfo('system', SYSTEM_INFO);
  }

  /**
   * Get hotfixes
   */
  function getHotfixes() {
    var hotfixes = [];

    function formatHotfixData(data) {
      var XML_ATTR_NAME = 'name',
          XML_ATTR_LAST_UNPACKED = 'lastUnpacked',
          parser = new DOMParser(),
          xmlDoc = parser.parseFromString(data, 'text/xml'),
          packages = xmlDoc.getElementsByTagName("package");

      var pattern = /^cq-.*-hotfix-(\d+)$/i;

      for (var x = 0; x < packages.length; x++) {
        var name = packages[x].getElementsByTagName(XML_ATTR_NAME)[0].innerHTML,
            result = pattern.exec(name)

        if (result && packages[x].getElementsByTagName(XML_ATTR_LAST_UNPACKED)[0].innerHTML && hotfixes.indexOf(result[1]) === -1) {
          hotfixes.push(result[1]);
        }
      }

      hotfixes.sort(function(l, r){ return l < r; });

      sendMessage({
        type: 'hotfixes',
        status: 'success',
        data: '[' + hotfixes.join(', ') + ']'
      });
    };

    getInfo('hotfixes', HOTFIX_INFO, formatHotfixData, true);
  }

  /**
   * Gets location object without the content finder.
   *
   * @private
   * @returns {Object} Pseudo location object
   */
  function getNormalizedLocation() {
    if (location.pathname === '/cf') {
      var anchor = document.createElement('a');

      anchor.href = location.href.replace('/cf#/', '/');

      return {
        pathname : anchor.pathname,
        origin : anchor.origin,
        search : anchor.search,
        host : anchor.host,
        hostname : anchor.hostname,
        protocol : anchor.protocol,
        port : anchor.port
      };
    } else {
      return location;
    }
  }

  /**
   * Get a location pathname for use in an AJAX call to the JCR.
   *
   * Add the jcr:content node to the current path, change selector
   * from html to an inifinity JSON selector, remove editor.html.
   *
   * @private
   * @param {String} location pathname
   * @returns {String} location pathname ready for use to 
   */
  function getPathnameForJcrAjaxCall(pathname){
    var EDITOR = '/editor.html',
        HTML_EXTENSION = '.html',
        JSON_EXTENSION = '.-1.json';

    if (pathname.indexOf(EDITOR) === 0) {
      pathname = pathname.replace(EDITOR, '');
    }

    pathname = pathname.replace(HTML_EXTENSION, JSON_EXTENSION);

    return pathname;
  }

  /**
   * @public
   */
  return {
    openDigitalPulseDebugger : openDigitalPulseDebugger,
    clearClientLibs : clearClientLibs,
    clearCompiledJSPs : clearCompiledJSPs,
    clearLinkChecker : clearLinkChecker,
    getUserInfo: getUserInfo,
    getAllInfo : getAllInfo,
    getWindowInfo : getWindowInfo,
    logOut : logOut,
    logIn : logIn,
    activateTree : activateTree,
    activatePage : activatePage,
    deactivatePage : deactivatePage,
    getHotfixes : getHotfixes
  };
})(window);

/* Send window title, window location and user information on page load */
AemDeveloper.getWindowInfo();
AemDeveloper.getUserInfo();