import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./nodeattributes/nodeattributes"
import axios from "axios";
import {setupCytoscape} from "./graphview/graphview";
import {setupEventView} from "./eventview/eventview";
import {setupErrorView} from "./errorview/errorview";

axios.defaults.baseURL = location.protocol + '//' + location.hostname + ':' + 5000;
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

setupCytoscape();
setupEventView()
setupErrorView()