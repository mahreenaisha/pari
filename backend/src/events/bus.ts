import { EventEmitter } from "node:events";
import type { PariEventDto } from "../contracts/index.js";

type Listener = (event: PariEventDto) => void;
type GlobalListener = (merchantId: string, event: PariEventDto) => void;

const ALL = Symbol("all");

/** In-process pub/sub, scoped per merchant. Feeds the SSE stream and the conversation engine. */
export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  publish(merchantId: string, event: PariEventDto): void {
    this.emitter.emit(merchantId, event);
    this.emitter.emit(ALL, merchantId, event);
  }

  subscribe(merchantId: string, listener: Listener): () => void {
    this.emitter.on(merchantId, listener);
    return () => this.emitter.off(merchantId, listener);
  }

  subscribeAll(listener: GlobalListener): () => void {
    this.emitter.on(ALL, listener);
    return () => this.emitter.off(ALL, listener);
  }
}
