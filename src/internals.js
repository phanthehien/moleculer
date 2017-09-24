/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const _ 					= require("lodash");

module.exports = function(broker) {
	const schema = {
		name: "$node",

		actions: {
			list: {
				cache: false,
				handler() {
					return this.broker.registry.getNodeList();
				}
			},

			services: {
				cache: false,
				params: {
					onlyLocal: { type: "boolean", optional: true },
					skipInternal: { type: "boolean", optional: true },
					withActions: { type: "boolean", optional: true }
				},
				handler(ctx) {
					let res = [];

					const services = this.broker.registry.getServiceList(ctx.params);

					// Pre-process list, group services by nodes.
					services.forEach(svc => {
						let item = res.find(o => o.name == svc.name && o.version == svc.version);
						if (item) {
							item.nodes.push(svc.nodeID);
							// Merge services
							_.forIn(svc.actions, (action, name) => {
								if (action.protected === true) return;

								if (!item.actions[name])
									item.actions[name] = _.omit(action, ["handler", "service"]);
							});

						} else {
							item = _.pick(svc, ["name", "version", "settings", "metadata"]);
							item.nodes = [svc.nodeID];
							item.actions = {};
							_.forIn(svc.actions, (action, name) => {
								if (action.protected === true) return;

								item.actions[name] = _.omit(action, ["handler", "service"]);
							});
							res.push(item);
						}
					});

					return res;
				}
			},

			actions: {
				cache: false,
				params: {
					onlyLocal: { type: "boolean", optional: true },
					skipInternal: { type: "boolean", optional: true },
					withEndpoints: { type: "boolean", optional: true }
				},
				handler(ctx) {
					return this.broker.registry.getActionList(ctx.params);
				}
			},

			events: {
				cache: false,
				params: {
					onlyLocal: { type: "boolean", optional: true },
					skipInternal: { type: "boolean", optional: true },
					withEndpoints: { type: "boolean", optional: true }
				},
				handler(ctx) {
					return this.broker.registry.getEventList(ctx.params);
				}
			},

			health: {
				cache: false,
				handler() {
					return this.broker.getHealthStatus();
				}
			}
		}
	};

	if (broker.statistics) {
		schema.actions.stats = {
			cache: false,
			handler() {
				return this.broker.statistics.snapshot();
			}
		};
	}

	return schema;
};
