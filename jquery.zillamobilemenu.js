/**
 * jQuery zillaMobileMenu v0.1
 *
 * Author: Mark Southard
 */

;(function($, window, document, undefined){

	// global vars
	$window = $(window);

	/*
	 * debouncedresize: special jQuery event that happens once after a window resize
	 *
	 * latest version and complete README available on Github:
	 * https://github.com/louisremi/jquery-smartresize
	 *
	 * Copyright 2012 @louis_remi
	 * Licensed under the MIT license.
	 *
	 * This saved you an hour of work?
	 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
	 */

	var $event = $.event,
		$special,
		resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};

	$.fn.debouncedresize = function( fn ) {
		return fn ? this.bind( "debouncedresize", fn ) : this.trigger("debouncedresize", ["execAsap"]);
	};

	/*
	 *  Zilla Mobile Menu
	 */

	// Set up local instance with defaults
	var zmm = {};
	zmm.defaults = {
		breakPoint : 768,
		hideNavParent : false,
		// @TODO improve prependTo to hide menu slide out
		prependTo : 'body',
		speed : 500,
		triggerText : 'Menu', 
		onInit : function() {},
		afterInit : function() {},
		beforeOpen : function() {},
		beforeClose : function() {}
	};
	// Method calling logic
	$.fn.zillaMobileMenu = function(method) {
		if ( zmm.methods[method] ) {
			return zmm.methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return zmm.methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' + method + ' does not exist on jQuery.zillaMobileMenu' );
		}
	};
	zmm.methods = {
		init: function( opts ) {
			return this.each(function() {
				// Set up local variables
				var _ = $(this),
					navExists = false;
					// Namespace instance data
					data = _.data('zillaMobileMenu'),
					o = $.extend({}, zmm.defaults, opts);

				if( !data ) {
					// Initialize data
					var nav = _.clone().addClass('zilla-mobile-menu'),
						trigger = $('<a class="zilla-mobile-menu-dropdown" href="#">' + o.triggerText + '</a>');

					nav.data('zillaMobileMenu', {
						nav : nav,
						navHeight : 0, // set in make function
						totalHeight : 0, // set in make function
						trigger : trigger,
						triggerHeight : 0, // set in make function
						created : false, // set to true in make function
						options : o
					});

					data = nav.data('zillaMobileMenu'); // make ready for rest of init
				}

				// Sanity check
				if( data.initialized ) {
					if( typeof(console) != 'undefined') 
						console.warn('ZillaMobileMenu already initialized on', this);
					return this;
				}
				data.initialized = true;

				// Call onInit Callback
				o.onInit.call(null,nav);

				// Create menu
				if( $window.width() <= o.breakPoint ) {
					zmm.methods.make( nav );
					nav.parent().show();
					// Hide original nav
					if( o.hideNavParent ) _.parent().hide();
					else _.hide();
				}

				// Handle resize
				$window.bind( 'debouncedresize', function() {
					if( $window.width() <= o.breakPoint ) {
						if( ! data.created )
							zmm.methods.make( nav );

						nav.parent().show();
						// Hide original nav
						if( o.hideNavParent ) _.parent().hide();
						else _.hide();
					} else {
						// show original nav
						if( o.hideNavParent ) _.parent().show();
						else _.show();

						if( data.created ) nav.parent().hide();
					}

				});

				// Add listeners
				trigger.on('click', function(e) {
					var $this = $(this);
					if( $this.hasClass('open') ) { // close it
						zmm.methods.close( $this.next('.zilla-mobile-menu') );
					} else { // open it
						zmm.methods.open( $this.next('.zilla-mobile-menu') );
					}
					e.preventDefault();
					e.stopPropagation();
					return false;
				});

				// Call afterInit Callback
				o.afterInit.call(null,nav);

			}); // End jQuery.each
		},
		make: function( elem ) {
			if( typeof(elem) === 'undefined' ) {
				var elem = $(this);
			}

			return elem.each(function () {
				var data = elem.data('zillaMobileMenu'),
					o = data.options;

				// add menu to the dom
				elem.prependTo(o.prependTo).wrap('<div class="zilla-mobile-menu-wrap" />');
				data.trigger.insertBefore(elem);

				// set our values in data for later use
				data.triggerHeight = data.trigger.outerHeight();
				data.navHeight = elem.outerHeight();
				data.totalHeight = data.navHeight + data.triggerHeight;

				elem.css({
					'display' : 'none',
					'marginTop' : '-' + data.totalHeight + 'px',
					'position' : 'absolute',
					'visibility' : 'hidden'
				});
				
				data.created = true;

			}); // End jQuery each
		},
		open: function( elem ) {
			if( typeof(elem) === 'undefined' ) {
				var elem = $(this);
			}

			return elem.each( function() {
				var data = elem.data('zillaMobileMenu'),
					o = data.options;

				o.beforeOpen.call(null,elem);
				elem.prev('.zilla-mobile-menu-dropdown').addClass('open');

				elem.css({
						'display' : 'block',
						'visibility' : 'visible'
					})
					.animate({
						marginTop : data.triggerHeight + 'px'
					}, o.speed);
			});
		}, // End open method
		close: function( elem ) {
			if( typeof(elem) === 'undefined' ) {
				var elem = $(this);
			}

			return elem.each( function() {
				var data = elem.data('zillaMobileMenu'),
					o = data.options;

				o.beforeClose.call(null,elem);
				elem.prev('.zilla-mobile-menu-dropdown').removeClass('open');
				elem.animate({
					marginTop : '-' + data.totalHeight + 'px'
				}, o.speed, function() {
					elem.css({
						'display' : 'none',
						'visibility' : 'hidden'
					});
				});
			});
		}, // End close method
		destroy: function() {
			return this.each( function() {
				if( $(this).data('zillaMobileMenu') ) {
					var data = $(this).data('zillaMobileMenu'),
						o = data.options;
					$(this).removeData('zillaMobileMenu');
				} else {
					if( typeof(console) !== 'undefined' )
						console.warn('ZillaMobileMenu not initialized on that dom element');
				}
			}); // End jQuery.each
		} // End destroy method
	}; // End methods

})(jQuery, window, document);