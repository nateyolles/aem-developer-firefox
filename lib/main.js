var { ToggleButton } = require('sdk/ui/button/toggle'),
    panels = require("sdk/panel"),
    data = require("sdk/self").data,
    tabs = require("sdk/tabs"), //tabs.activeTab.url
    request = require("sdk/request").Request,
    mod = require("sdk/page-mod"),
    worker,
    button,
    panel;

button = ToggleButton({
  id: "my-button",
  label: "my button",
  icon: {
    "16": "./images/icon16.png",
    "32": "./images/icon32.png",
    "64": "./images/icon64.png"
  },
  onChange: handleChange
});

panel = panels.Panel({
  width: 454,
  height: 565,
  contentURL: data.url("popup.html"),
  onHide: handleHide
});

panel.port.on('message', function(data){
  worker.port.emit('message', data);
});

panel.port.on('updateTab', function(url){
  tabs.activeTab.url = url;
  panel.hide();
});

panel.port.on('newTab', function(url){
  tabs.open(url);
  panel.hide();
});

panel.port.on('closePanel', function(){
  panel.hide();
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });

    worker = tabs.activeTab.attach({
      contentScriptFile: data.url("content.js")
      // contentScriptFile: data.url([
      //   data.url('content.js'),
      //   data.url('jsondiffpatch-full.min.js'),
      //   data.url('jsondiffpatch-formatters.min.js'),
      //   data.url('diff_match_patch_uncompressed.js')
      // ])
    });

    worker.port.on('message', function(data){
      panel.port.emit('message', data);
    });

    worker.port.on('closePanel', function(){
      panel.hide();
    });

  }
}

function handleHide() {
  button.state('window', {checked: false});
}