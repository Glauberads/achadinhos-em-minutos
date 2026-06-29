export * from './event-types';
export * from './event-bus';
// event-emitter.ts e event-registry.ts não devem ser exportados globalmente
// para garantir que a aplicação só use a interface EventBus.emit()
