if (!Upsell) {
  var Upsell = {};
}

if (!Logger) {
  var Logger = {};
}

Logger = {
  debugIsOn : false,
  setDebug : function(isOn) {
    this.debugIsOn = isOn;
  },
  error : function(msg) {
    if (this.debugIsOn) {
      window.alert(msg);
    }
  }
};
Upsell.Util = {
  isHotmartProductionEnv: !(window.location.hostname.endsWith('.buildstaging.com') || window.location.hostname.endsWith('.s3.amazonaws.com')),
  elementsReleasePercentage: 100,
  externalLogger : function(messageTitle, messageData) {
    console.log('[LegacyFunnelScript] - ',  messageTitle, messageData)
    return fetch(`https://pay.hotmart.com/api/next/client-log/info`, {
      method: 'POST',
      mode: "no-cors",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          type: `[LegacyFunnelScript] - ${messageTitle}`,
          href: location.href,
          messageData,
        },
      }),
    })
  },
  showDeprecationNotice: function() {
    const deprecationMessage = {
      en: 'Attention: This version of the funnel script has been discontinued. Please obtain the new version on your sales funnel configuration page.',
      pt_BR: 'Atenção: Esta versão do script de funil foi descontinuada. Por favor, obtenha a nova versão na página de configuração do seu funil de vendas.',
      es: 'Atención: Esta versión del script del embudo ha sido descontinuada. Por favor, obtén la nueva versión en la página de configuración de tu embudo de ventas.',
    }
    let lang = navigator?.language || 'en'
    for(const key in deprecationMessage) {
      lang = lang.startsWith(key)? key : 'en'
    }
    console.warn('⚠️', deprecationMessage[lang])
  },
  loadCheckoutElements: function() {
    const src = Upsell.Util.isHotmartProductionEnv
      ? 'https://checkout.hotmart.com/lib/hotmart-checkout-elements.js'
      : 'https://checkout.buildstaging.com/lib/hotmart-checkout-elements.js'
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve('script already exist')
      }
      else {
        const s = document.createElement('script')
        s.src = src
        s.type = 'text/javascript'
        s.async = true
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      }
    })
  },
  initCheckoutElements: function(params) {
    const { width, height, element } = params
    Upsell.Util.loadCheckoutElements().then(()=>{
      const wrapperElement = Upsell.Frame.getBox()
      checkoutElements.init('salesFunnel', {
        legacy: true
      }).mount(wrapperElement)
      if (!wrapperElement) return
      const elementsIframe = wrapperElement.querySelector(`:scope > .custom-element__iframe`)
      elementsIframe.id = 'hotmart_upsell_iframe'
      elementsIframe.classList.add('hotmart_upsell_iframe')
      if (width) {
        elementsIframe.width = width
      }
      if (height) {
        elementsIframe.height = height
      }
    }).catch(error =>{
      Upsell.Util.externalLogger(`Error loading checkout elements ${error.message}`, params);
      console.error('Error:', error);
      Upsell.Frame.show(params, true)
    })
  },
  getProtocol : function() {
    return document.location.protocol;
  },
  render : function(template, params) {
    return template.replace(/\#\{([^{}]*)\}/g, function(a, b) {
      var r = params[b] || '';
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    });
  },
  toQueryString : function(params) {
    var pairs = [];
    for (var key in params) {
      if (params[key] !== null && params[key] !== '' && typeof params[key] !== 'function') {
        pairs.push( [ key, params[key] ].join('='));
      }
    }
    return pairs.join('&');
  }
};
Upsell.Frame = {
  urlFunnel : function(params){
    var queryString = window.location.search;
    console.log(params);
    var currentHost = window.location.hostname.indexOf('buildstaging.com') !== -1
      ? 'https://app-hotmart-checkout.buildstaging.com/funnel'
      : 'https://pay.hotmart.com/funnel';
    if (queryString.indexOf('?fsid') === -1) {
      currentHost += '?'
    }
    var url = currentHost + queryString + "&" + (params.buttonImage !== '' ? 'buttonImage=' + params.buttonImage + '&' : '') + (params.customStyle !== '' ? 'customStyle=' + params.customStyle + '&' : '');
    var funnel = '<iframe id="hotmart_upsell_iframe" class="hotmart_upsell_iframe" src="' + url + '#{query}" width="#{width}" height="#{height}" frameborder="0" scrolling="auto" allowtransparency="true"></iframe>';

    return { funnelFrame: funnel };
  },
  content_template : function(params) {
    return { frame : this.urlFunnel(params).funnelFrame }
  },
  //'<iframe id="hotmart_upsell_iframe" src="' + document.querySelector('script[src$="upsell-window.js"]').getAttribute('src').split('js/widgets/upsell-window.js')[0] + '/widgets/funnel/upsell.html?#{query}" width="#{width}" height="#{height}" frameborder="0" scrolling="auto" allowtransparency="true" ></iframe>',
  //content_template : '<iframe id="hotmart_upsell_iframe" src="//www.hotmart.net.br/widgets/funnel/upsell.html?#{query}" width="#{width}" height="#{height}" frameborder="0" scrolling="auto" allowtransparency="true" ></iframe>',

  getBox : function() {
    return document.getElementById("box_hotmart");
  },
  getQuery : function(params) {
    return Upsell.Util.toQueryString( {
      key : params.key,
      launcherCode: params.launcherCode
    });
  },
  getFrameParams : function(params) {
    return {
      protocol : Upsell.Util.getProtocol(),
      query : this.getQuery(params),
      width : params.width,
      height : params.height,
      buttonImage: params.buttonImage || '',
      customStyle: params.customStyle || ''
    };
  },
  b64EncodeUnicode: function(str){
    // Read this - https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }))
  },
  show : function(params, forceLegacy) {
    var iframeStyles = document.createElement('style');
    iframeStyles.innerHTML = '@media only screen and (max-width: 720px) { .hotmart_upsell_iframe {width: 100%; height: 380px} }';
    document.head.appendChild(iframeStyles);

    const {key, width, height, launcherCode, element, customStyle, ...otherParams} = params;
    if (Object.keys(otherParams).length) {
      Upsell.Util.externalLogger('Somebody using deprecated parameters', otherParams)
    }
    if (Math.random() < Upsell.Util.elementsReleasePercentage / 100 && !forceLegacy) {
      Upsell.Util.initCheckoutElements(params)
      return
    }
    params.buttonImage = this.b64EncodeUnicode(params.buttonImage || '');
    params.customStyle = this.b64EncodeUnicode(params.customStyle || '');
    var iframeParams = this.getFrameParams(params);
    var iframeHtml = Upsell.Util.render(this.content_template(params).frame, iframeParams);
    var box = this.getBox();

    box.innerHTML = iframeHtml;
  }
};
Upsell.Widget = {
  setupOptions : function(params, optDebug) {
    if (optDebug !== null && typeof (optDebug) !== 'undefined') {
      Logger.setDebug(optDebug);
    } if (typeof (params) === 'undefined' || params === null) {
      Logger.error("Nenhum parametro informado ao Widget do Hotmart. Verifique se a variavel 'opts' se ela esta preenchida ou com algum erro de sintaxe.");
      return;
    } if (params.key === null) {
      Logger.error("A chave ('key') do widget deve ser informada. Verifique na variavel 'opts' e adicione a propriedade 'key' com o valor retornado pelo Hotmart");
      return;
    }
    this.params = params;
  },
  show : function(options, optDebug) {
    if (Upsell.Util.elementsReleasePercentage === 100) {
      Upsell.Util.showDeprecationNotice()
    }
    this.setupOptions(options, optDebug);
    Upsell.Frame.show(this.params);
  }
};
