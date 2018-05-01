var behavior = require("../behavior");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");


/**
 * @module can-connect/base/base base
 * @group can-connect/base/base.options 0 behavior options
 * @group can-connect/base/base.identifiers 1 identifiers
 * @parent can-connect.behaviors
 *
 * The first behavior added to every `can-connect` connection. Provides methods to uniquely identify instances and
 * lists.
 *
 * @signature `base(connectionOptions)`
 *
 * Provides instance and list identifiers. Added automatically to every connection created by the `connect` helper.
 * So even if we do:
 *
 * ```js
 * var connection = connect([],{});
 * ```
 *
 * The connection still has the identification functionality provided by `base`:
 *
 * ```js
 * connection.id({id: 1, ...}) //-> 1
 * ```
 *
 * `can-connect` connections are typically created by the `connect` helper rather than by calling the behaviors directly.
 * This ensures the behaviors are called in the required order and is more elegant than requiring the user to chain
 * together the calls to all the behaviors.
 *
 * See the [can-connect/base/base.id id] and [can-connect/base/base.listSet listSet] methods for more specifics on
 * how ids are determined.
 *
 * @param {Object} connectionOptions Object containing the configuration for the behaviors of the connection. Added to the
 * prototype of the returned connection object. `base` is almost always configured with an [can-connect/base/base.queryLogic] option since it
 * [can-connect/base/base.id defines the id property] and the majority of behaviors also require the queryLogic.
 *
 * @return {Object} A `can-connect` connection containing the methods provided by `base`.
 */
module.exports = behavior("base",function(baseConnection){
	return {
		/**
		 * @function can-connect/base/base.id id
		 * @parent can-connect/base/base.identifiers
		 *
		 * Uniquely identify an instance or raw instance data.
		 *
		 * @signature `connection.id(instance)`
		 *
		 *   Returns the instance id as determined by [can-connect/base/base.queryLogic]'s id values.
		 *
		 *   @param {Instance|Object} instance An instance or raw properties for an instance.
		 *
		 *   @return {String|Number} A string or number uniquely representing `instance`.
		 *
		 *
		 * @body
		 *
		 * ## Use
		 *
		 * Many behaviors, such as the [can-connect/constructor/store/store], need to have a unique identifier for an
		 * instance or instance data.  This `connection.id` method should return that.
		 *
		 * Typically, an item's id is a simply property value on the object. For example, "Todo" data might look like:
		 *
		 * ```js
		 * {_id: 5, name: "do the dishes"}
		 * ```
		 *
		 * In this case, [can-connect/base/base.queryLogic]'s `id` property should be set to "_id":
		 *
		 * ```js
		 * import QueryLogic from "can-query-logic";
		 *
		 * var queryLogic = new QueryLogic({
		 *   identity: ["_id"]
	 	 * });
		 *
		 * connect([...],{queryLogic: queryLogic});
		 * ```
		 *
		 */
		id: function(instance){
			return canReflect.getIdentity(instance, this.queryLogic.schema);
		},


		/**
		 * @function can-connect/base/base.listSet listSet
		 * @parent can-connect/base/base.identifiers
		 *
		 * Uniquely identify the set of data a list contains.
		 *
		 * @signature `connection.listSet(list)`
		 *
		 *   Returns the value of the property referenced by [can-connect/base/base.listSetProp] if it exists.
		 *   By default, this will return `list[Symbol.for("can.listSet")]`.
		 *
		 *   @param {can-connect.List} list A list instance.
		 *
		 *   @return {can-query-logic/query} An object that can be passed to `JSON.stringify` to represent the list.
		 *
		 * @body
		 *
		 * ## Use
		 *
		 * Many behaviors, such as the [can-connect/constructor/store/store], need to have a unique identifier for a list.
		 * This `connection.listSet` method should return that.
		 *
		 * Typically, a list's set identifier is a property on the list object.  As example, a list of Todos might look like
		 * the following:
		 *
		 * ```js
		 * var dueTodos = todoConnection.getList({filter: {due: "today"}});
		 * dueTodos; // [{_id: 5, name: "do dishes", due:"today"}, {_id: 6, name: "walk dog", due:"today"}, ...]
		 * dueTodos[Symbol.for("can.listSet")]; //-> {filter: {due: "today"}}
		 * todoConnection.listSet(dueTodos); //-> {filter: {due: "today"}}
		 * ```
		 *
		 * In the above example the [can-connect/base/base.listSetProp] would be the default `@can.listSet`.
		 */
		listSet: function(list){
			return list[this.listSetProp];
		},

		/**
		 * @property {Symbol} can-connect/base/base.listSetProp listSetProp
		 * @parent can-connect/base/base.identifiers
		 *
		 * Specifies the property that uniquely identifies a list.
		 *
		 * @option {Symbol} The property that uniquely identifies the list.
		 * Defaults to `Symbol.for("can.listSet")`.
		 *
		 * ```js
		 * var dataUrl = require("can-connect/data/url/");
		 * var connection = connect([dataUrl], {
		 *   listSetProp: "set"
		 * });
		 *
		 * var list = [{id: 1, ...}, {id: 2, ...}]
		 * list.set = {complete: true};
		 *
		 * connection.listSet(list) //-> {complete: true}
		 * ```
		 *
		 */
		listSetProp: canSymbol.for("can.listSet"),

		init: function(){},

		get queryLogic(){
			if(baseConnection.queryLogic) {
				return baseConnection.queryLogic;
			} else if(baseConnection.algebra) {
				return baseConnection.algebra;
			}
		}

		/**
		 * @property {can-query-logic} can-connect/base/base.queryLogic queryLogic
		 * @parent can-connect/base/base.options
		 *
		 * A `can-query-logic` instance used for list comparison, instance identification and membership
		 * calculations. A way for the `can-connect` behaviors to understand what the properties of a request mean and act
		 * on them.
		 *
		 * @option {can-query-logic} A [can-query-logic queryLogic] that is used to perform calculations using set
		 * definition objects passed to [can-connect/connection.getListData] and [can-connect/connection.getList].
		 * Needed to enable [can-connect/fall-through-cache/fall-through-cache caching],
		 * [can-connect/data/combine-requests/combine-requests request combining], [can-connect/real-time/real-time] and other
		 * behaviors. By default no queryLogic is provided.
		 *
		 * An example of the types of calculations behaviors will make using the queryLogic:
		 * ```js
		 * var queryLogic = new QueryLogic({
		 *   identity: ['_uid'],
		 *   keys: {
		 *     _uid: Number
		 *   }
		 * });
		 *
		 * var todoConnection = connect([...behaviors...],{
		 *   queryLogic: queryLogic
		 * });
		 *
		 * todoConnection.queryLogic.memberIdentity({_uid: 5, ...}); //-> 5
		 * todoConnection.id({_uid: 5, ...}); //-> 5
		 * todoConnection.queryLogic.intersection({page: {first: 0, last: 10}},
		 *   {page: {first:5, last:20}}); //-> {first:5, last:10}
		 * ```
		 */


		/**
		 * @property {can-connect/DataInterface} can-connect/base/base.cacheConnection cacheConnection
		 * @parent can-connect/base/base.options
		 *
		 * An underlying `can-connect` connection used when fetching data from a cache.
		 *
		 * @option {can-connect/DataInterface} A connection that provides access to a cache via [can-connect/DataInterface]
		 * requests. Several behaviors including [can-connect/fall-through-cache/fall-through-cache] expect this property.
		 *
		 * @body
		 *
		 * ## Use
		 *
		 * ```js
		 * var cacheConnection = connect([
		 *   require("can-connect/data/memory-cache/memory-cache")
		 * ],{});
		 *
		 * var todoConnection = connect([...behaviors...],{
		 *   cacheConnection: cacheConnection
		 * });
		 * ```
		 */
	};
});
