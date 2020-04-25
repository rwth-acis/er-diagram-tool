import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import Common from './common.js';
import ModelOps from './model-ops.js';
import Static from './static.js';

/**
 * @customElement
 * @polymer
 */
class StaticApp extends PolymerElement {
  static get template() {
    return html`
      <head>
        <!-- Bootstrap core CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" crossorigin="anonymous">
      </head>
      <style>
        :root {
          --statusbar-background: #808080;
        }
        :host {
          display: block;
        }
        #yjsroomcontainer, #modeluploader {
          display: flex;
          margin: 5px;
          flex: 1;
          align-items: center;
        }
        .loader {
          border: 5px solid #f3f3f3; /* Light grey */
          border-top: 5px solid #3498db; /* Blue */
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 2s linear infinite;
          display:none;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        paper-input {
          max-width: 300px;    
        }
        paper-button{
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          max-height: 30px;
        }
        paper-button:hover{
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        iframe {
          width: 100%;
          height: 100%;
        }
        .maincontainer { 
            display: flex;
            height: 800px;
            flex-flow: row wrap;
        }
        .activitycontainer { 
          display: flex;
          height: 400px;
          width: 400px;
          flex-flow: row wrap;
        }
        .innercontainer {
            padding: 5px;
            margin: 5px;
            flex: 1;
        }
        .innercontainer:nth-of-type(1) {
            flex: 6;
            display: flex;
            flex-flow: column;
        }
        .innercontainer:nth-of-type(2) {
            flex: 1;
            display: flex;
            flex-flow: column;
        }
      </style>

      <las2peer-frontend-statusbar
        id="statusBar"
        service="ER Diagram Tool"
        oidcpopupsigninurl="/src/callbacks/popup-signin-callback.html"
        oidcpopupsignouturl="/src/callbacks/popup-signout-callback.html"
        oidcsilentsigninturl="/src/callbacks/silent-callback.html"
        oidcclientid="{OIDC_CLIENT_ID}"
        autoAppendWidget=true
      ></las2peer-frontend-statusbar>    

      <div style="display: flex;">
        <div style="flex-grow: 1;">
          <p id="currentRoom">Current Space: Test</p>
          <div id="yjsroomcontainer">
            <paper-input id="yjsRoomInput" always-float-label label="Space"></paper-input>
            <paper-button on-click="_onChangeButtonClicked">Enter</paper-button>
            <div class="loader" id="roomEnterLoader"></div> 
          </div>
        </div>
        <div>
          <a href="https://github.com/rwth-acis/CAE">
            <img src="http://dbis.rwth-aachen.de/noracle/assets/las2peer.svg" alt="las2peer" style="width:420px;height:70px"/>
          </a>
        </div>
      </div>

      <div class="maincontainer">
        <div class="innercontainer">
          <iframe id="Canvas" src="{WEBHOST}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="innercontainer">
          <iframe id="Palette" src="{WEBHOST}/syncmeta/palette.html"> </iframe>
          <iframe id="Property Browser" src="{WEBHOST}/syncmeta/attribute.html"> </iframe>
        </div>
      </div>  
      <div class="activitycontainer">
        <iframe id="User Activity" src="{WEBHOST}/syncmeta/activity.html"> </iframe>
      </div>  
    `;
  }

  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'static-app'
      },
      page:{
        type: String,
        value: 'sbf',
        observer: '_pageChanged'
      }
    };
  }

  static get observers(){
	  return ['_routerChanged(routeData.page)'];
  }


  ready() {
    super.ready();
    Common.setSpace(Static.ERModelingSpaceId);
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");
    const statusBar = this.shadowRoot.querySelector("#statusBar");
    statusBar.addEventListener('signed-in', this.handleLogin);
    statusBar.addEventListener('signed-out', this.handleLogout);
    this.displayCurrentRoomName();
    this.enterDefaultRoomIfNoCurrentRoom();
  }

  _onChangeButtonClicked() {
    var roomName = this.shadowRoot.querySelector('#yjsRoomInput').value;
    Common.setYjsRoomName(roomName);
    this.changeVisibility("#roomEnterLoader", true);

    ModelOps.uploadMetaModel()
      .then(_ => new Promise((resolve, reject) => {
        // wait for data become active
        setTimeout(_ => resolve(), 2000);
      }))
      .then(_ => location.reload());
  }

  enterDefaultRoomIfNoCurrentRoom() {
    if (Common.getYjsRoomName()) {
      return;
    } else {
      Common.setYjsRoomName("Default");
      ModelOps.uploadMetaModel()
        .then(_ => new Promise((resolve, reject) => {
          // wait for data become active
          setTimeout(_ => resolve(), 2000);
        }))
        .then(_ => location.reload());
    }
  }

  displayCurrentRoomName() {
    var spaceHTML = "";
    if (Common.getYjsRoomName()) {
      spaceHTML = `<span style="font-weight: bold;">Current Space:</span> ${Common.getYjsRoomName()}`;
    } else {
      spaceHTML = "Please enter a space!";
    }
    this.shadowRoot.querySelector('#currentRoom').innerHTML = spaceHTML;
  }

  changeVisibility(htmlQuery, show) {
    var item = this.shadowRoot.querySelector(htmlQuery);
    if (show) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  } 

  handleLogin(event) {
    localStorage.setItem("access_token", event.detail.access_token);
    localStorage.setItem("userinfo_endpoint", "https://api.learning-layers.eu/o/oauth2/userinfo");
    location.reload();
  }

  handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userinfo_endpoint");
  }
}

window.customElements.define('static-app', StaticApp);
