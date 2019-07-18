import { PolymerElement, html } from "@polymer/polymer/polymer-element.js";
import '@polymer/paper-dialog/paper-dialog.js';
import './modal-contents.js';
import './kanban-container.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';

class MainApp extends PolymerElement {
  static get template() {
    return html`
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 10px;
          font-Family: 'Lato', Sans-Serif;
          font-Size: 16px;
          line-height: 1.6;
        }

        header {
          height: 200px;
          background: linear-gradient(to right, rgba(140, 161, 211, 0.6), rgba(48, 55, 103, 1)), url('images/bckgrnd1.jpg');
          background-position: center;
          background-size: cover;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 70%)
        }

        svg {
          position: absolute;
          top: 4vh;
          left: 3vw;
        }

        .progress-bar {
          width: 20vw;
          position: absolute;
          right: 7vw;
          top: 4vh;
          color: #afb0c0;
        }

        .empty-bar {
          width: 20vw;
          height: 3vh;
          border: 8px solid #24294a;
          border-radius: 15px;
          position: absolute;
          top: 0;
          left: 0;
        }

        .fill-bar {
          width: 0vw;
          height: 3vh;
          background: linear-gradient(to right, #4787fb, #67dffd);
          border-radius: 15px;
          position: absolute;
          top: 0;
          left: 0;
        }

        .stats {
          position: absolute;
          top: 3vh;
          left: 2vw;
        }

        .progress-bar .highlight {
          color: white;
          font-size: 1.4em;
          font-weight: bold;
          margin-right: 1vw;
        }

        .btn {
          cursor: pointer;
          position: absolute;
          top: 10vh;
          left: 2vw;
          height: 3vh;
          width: 10vw;
          text-align: center;
          background: whitesmoke;
          color: #24294a;
          font-size: 1em;
          border-radius: 15px;
        }

        .btn:hover, .btn:focus {
          background:  rgb(218, 214, 214);
        }

        .btn:active {
          box-shadow: 0 1px 2px rgba(0,0,0, 0.5) inset;
        }

        main {
          background: #f8f7f9;
          height: 83.5vh;
          margin-top: -60px;
        }

        .modal {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          text-align: left;
          background: rgba(0,0,0, .9);
          transition: opacity .25s ease;
        }

        .modal__inner {
          transition: top .25s ease;
          position: absolute;
          top: -20%;
          right: 0;
          bottom: 0;
          left: 0;
          width: 50%;
          margin: auto;
          overflow: auto;
          background: #fff;
          border-radius: 5px;
          padding: 1em 2em;
          height: 50%;
        }

        .modal__close {
          position: absolute;
          right: 1em;
          top: 1em;
          width: 1.1em;
          height: 1.1em;
          cursor: pointer;
        }

        .modal__close:after,
        .modal__close:before {
          content: '';
          position: absolute;
          width: 2px;
          height: 1.5em;
          background: #ccc;
          display: block;
          transform: rotate(45deg);
          left: 50%;
          margin: -3px 0 0 -1px;
          top: 0;
        }

        .modal__close:hover:after,
        .modal__close:hover:before {
          background: #aaa;
        }

        .modal__close:before {
          transform: rotate(-45deg);
        }

        @media screen and (max-width: 768px) {
            
          .modal__inner {
            width: 90%;
            height: 90%;
            box-sizing: border-box;
          }
        }
      </style>
      <iron-ajax
        auto
        id="dataAjax"
        url="[[url]]/[[id]]"
        method="GET"
        handle-as="json"
        content-type="application/json"
        body="[[body]]"
        on-response="handleResponse">
      </iron-ajax>
      <paper-dialog id="modal" class="modal" modal>
        <div class="modal__inner">
            <button class="modal__close" dialog-confirm autofocus></button>
            <h2>Add a New Task</h2>
            <modal-contents id="taskInputs"></modal-contents>
        </div>
      </paper-dialog>

      <header>

          <svg width='10vw' height='10vh'>
              <image href='./images/kanban.svg' width='10vw' height='10vh' />
          </svg>



          <div class="progress-bar">
              <div class="empty-bar"></div>
              <div class="fill-bar" style="width:[[barWidth]]vw"></div>
              <div class="stats">
                  <p><span class="highlight">[[percentCompleted]]%</span> complete</p>
                  <p>[[tasksCompleted]] of [[taskLength]] tasks complete</p>
              </div>
              <button class='btn' on-click="openModal">New Task</button>
          </div>
      </header>

      <paper-dropdown-menu on-iron-select="changeSort" label="Date Sort" value="[[sort]]">
      <paper-listbox slot="dropdown-content" class="dropdown-content">
        <paper-item>Ascending</paper-item>
        <paper-item>Descending</paper-item>
      </paper-listbox>
    </paper-dropdown-menu>


      <main class='board'>
          <kanban-container tasks$="{{tasks}}" sort= "{{sort}}" id="kanban"></kanban-container>
      </main>
    `;
  }

  openModal() {
    this.$.modal.open();
  }

  ready() {
    super.ready();
    this.$.taskInputs.addEventListener('new task', event => this.addTask(event));
    this.$.kanban.addEventListener('status change', event => this.statusChange(event));
    this.$.kanban.addEventListener('color change', event => this.colorChange(event));
    this.$.kanban.addEventListener('delete task', event => this.deleteTask(event));
  
    this.socket = io();

    this.socket.on('task added', (data) => {
      this.push('tasks', data.payload);
    });

    this.socket.on('task updated', (data) => {
      this.getAll()
    });

    this.socket.on('task deleted', (data) => {
      console.log("Received emitted task delete");
      this.getAll();
    })
  }

  addTask(event) {
    this.id = "";
    this.set('body', event.detail);
    this.$.dataAjax.method = "POST";
    this.$.modal.close();
  }

  statusChange(event) {
    this.set('body', { status__c: event.detail.status__c });
    this.id = event.detail.id;
    this.$.dataAjax.method = "PUT";
  }

  colorChange(event) {
    this.set('body', { color__c: event.detail.color__c });
    this.id = event.detail.id;
    this.$.dataAjax.method = "PUT";
  }

  changeSort(event) {
    const temp = event.target.selectedItem.innerText;
    this.set('sort', temp);
  }

  deleteTask(event) {
    this.set('body',{});
    this.id = event.detail.id;
    //console.log("Deleting " + this.id )
    this.$.dataAjax.method = "DELETE";
  }

  getAll() {
    this.id = "";
    this.$.dataAjax.method = "GET";
    this.$.dataAjax.generateRequest();
  }

  handleResponse(event, res) {
    if ( this.$.dataAjax.method === "GET") {
      this.set('tasks', res.response);
    } else {
      this.getAll();
    }
    this.set('taskLength', this.tasks.length);
    this.set('tasksCompleted', this.tasks.filter(task => task.status__c==="Complete").length);
    this.set('percentCompleted', (this.taskLength === 0) ? 0 : Math.round(this.tasksCompleted * 100/this.taskLength));
    this.set('barWidth', Math.round(this.percentCompleted*20/100));
  }

  static get properties() {
    return {
      tasks: Array,
      body: Object,
      url: String,
      id: String
    }
  }

  constructor() {
    super();
    this.url = "/api/tasks";
    this.id = "";
    this.taskLength=0;
    this.tasksCompleted=0;
    this.percentCompleted=0;
    this.barWidth = 0;
    this.sort = "Ascending";
  }
}

customElements.define("main-app", MainApp);
