// src/api/signalr.ts
import * as signalR from "@microsoft/signalr";
import { getToken } from "../auth/tokenStorage";

export const buildConnection = () =>
  new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat", {
      accessTokenFactory: () => getToken() ?? "",
    })
    .withAutomaticReconnect()
    .build();
