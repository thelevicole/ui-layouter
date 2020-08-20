( function( $ ) {
    'use strict';

    /**
     * Attach plugin
     *
     * @param {object} options
     * @constructor
     */
    $.fn.uiLayouter = function( options = {} ) {
        const $builder = this;

        /**
         * Default plugin options
         *
         * @type {object}
         */
        const defaults = {

            /**
             * @var {int} Maximum number of collums allowed per row.
             */
            maxColumns: false,

            /**
             * @var {object} Override core classes.
             */
            classes: {},

            /**
             * Used to as the row element creator.
             *
             * @param {jQuery} $this Builder container.
             * @returns {jQuery}
             */
            createRow: function( $this ) {
                return $( '<div>' );
            },

            /**
             * Used to as the column element creator.
             *
             * @param {jQuery} $this Builder container.
             * @returns {jQuery}
             */
            createColumn: function( $this ) {
                return $( '<div>' );
            },

            /**
             * Used to as the item element creator.
             *
             * @param {jQuery} $this Builder container.
             * @param {jQuery} $item The selected item from the items list.
             * @returns {jQuery}
             */
            createItem: function( $this, $item ) {
                return $( `<div><div class="handle" draggable="true"></div><span>${$item.text()}</span></div>` );
            },

            /**
             * Used to as the dragging preview creator.
             *
             * @param {jQuery} $this Builder container.
             * @param {jQuery} $item The dragging item.
             * @returns {jQuery}
             */
            createPreview: function( $this, $item ) {
                return $( '<div>', {
                    text: $item.text()
                } );
            },

        };

        /**
         * @var {Object} User merged args.
         */
        const args = $.extend( true, defaults, options );

        /**
         * @var {Object} UI classes added to DOM elements
         */
        const classes = $.extend( {
            builder: 'ui-layouter-js',
            row: 'ui-layouter-js__row',
            column: 'ui-layouter-js__column',
            empty: 'ui-layouter-js__empty',
            item: 'ui-layouter-js__item',
            preview: 'ui-layouter-js__preview',
            dragging: 'ui-layouter-js__dragging',
            dragover: 'ui-layouter-js__dragover'
        }, args.classes || {} );

        /**
         * @var {Object} Tempory data storage
         */
        const temp = {
            $item: null,
            $preview: null
        };

        /**
         * Call a user defined callback or use default.
         *
         * @access private
         * @param name
         * @param ...params
         * @return {Mixed}
         */
        const callback = ( name, ...params ) => {
            if ( typeof args[ name ] === 'function' ) {
                return args[ name ]( $builder, ...params );
            } else if ( typeof defaults[ name ] === 'function' ) {
                return defaults[ name ]( $builder, ...params );
            }
        };

        /**
         * Stardardised function for creating a new row, adds relevent class
         *
         * @access private
         * @param params
         * @returns {jQuery}
         */
        const createRow = ( ...params ) => callback( 'createRow', ...params ).addClass( classes.row );

        /**
         * Stardardised function for creating a new column, adds relevent class
         *
         * @access private
         * @param params
         * @returns {jQuery}
         */
        const createColumn = ( ...params ) => callback( 'createColumn', ...params ).addClass( classes.column );

        /**
         * Stardardised function for creating a new item, adds relevent class
         *
         * @access private
         * @param params
         * @returns {jQuery}
         */
        const createItem = ( ...params ) => callback( 'createItem', ...params ).addClass( classes.item );

        /**
         * Stardardised function for creating a new preview, adds relevent class
         *
         * @access private
         * @param params
         * @returns {jQuery}
         */
        const createPreview = ( ...params ) => callback( 'createPreview', ...params ).addClass( classes.preview );

        /**
         * Create the moving preview element
         *
         * @access private
         * @returns {void}
         */
        const createMovingPreview = () => {
            if ( temp.$item ) {
                temp.$preview = createPreview( temp.$item );
                $builder.append( temp.$preview );
            }
        };

        /**
         * Remove the moving preview
         *
         * @access private
         * @returns {void}
         */
        const removeMovingPreview = () => {
            if ( temp.$preview ) {
                temp.$preview.remove();
                temp.$preview = null;
            }
        };

        /**
         * Remove empty elements from $el parent
         *
         * @param {jQuery} $el
         * @returns {void}
         */
        const emptyParents = ( $el ) => {
            $el.closest( `.${classes.column}` ).addClass( classes.empty );
            const isEmpty = $el.closest( `.${classes.row}` ).find( `.${classes.column}:not(.${classes.empty})` ).length === 0;
            if ( isEmpty ) {
                $el.closest( `.${classes.row}` ).addClass( classes.empty );
            }
        };

        /**
         * Create empty placeholders
         *
         * @access private
         * @returns {void}
         */
        const createPlaceholders = () => {

            /**
             * @var {string} Create a row DOM selector from class object
             */
            const rowSelector = `.${classes.row}`;

            /**
             * @var {string} Create a column DOM selector from class object
             */
            const columnSelector = `.${classes.column}`;

            /**
             * @var {jQuery} Create a new jQuery row element with empty class
             */
            const $rowPlaceholder = createRow().addClass( classes.empty );

            /**
             * @var {jQuery} Create a new jQuery column element with empty class
             */
            const $columnPlaceholder = createColumn().addClass( classes.empty );

            /**
             * Remove empty columns and rows before we create placholders
             */
            $builder.find( `${columnSelector}.${classes.empty}` ).remove();
            $builder.find( `${rowSelector}.${classes.empty}` ).remove();

            /**
             * Only continue if we have non-empty rows
             */
            if ( $builder.find( rowSelector ).length ) {

                /**
                 * Add a placholder row before each non-empty row
                 */
                $builder.find( rowSelector ).each( function() {
                    $rowPlaceholder.clone().insertBefore( $( this ) );
                } );

                /**
                 * Add one last placeholder row after the final non-empty row
                 */
                $builder.append( $rowPlaceholder.clone() );

                /**
                 * Loop through non-empty rows
                 */
                $builder.find( rowSelector ).not( `.${classes.empty}` ).each( function() {

                    /**
                     * @var {jQuery} Current row element
                     */
                    const $row = $( this );

                    /**
                     * @var {jQuery} All columns that aren't empty
                     */
                    const $cols = $row.find( columnSelector ).not( `.${classes.empty}` );

                    /**
                     * Only continue if we have non-empty columns
                     */
                    if ( $cols.length ) {

                        /**
                         * Add a placholder columns before each non-empty column
                         */
                        $cols.each( function() {
                            $columnPlaceholder.clone().insertBefore( $( this ) );
                        } );

                        /**
                         * Add one last placeholder column after the final non-empty column
                         */
                        $row.append( $columnPlaceholder.clone() );
                    }
                } );

            }
        };

        /**
         * Called on plugin initiate
         *
         * @access private
         * @returns {void}
         */
        const initiate = () => {
            $builder.addClass( classes.builder );
        };

        /**
         * Handle dragstart event, storing draging element and creating preview.
         */
        $builder.on( 'dragstart', '[draggable="true"], [draggable]', function( event ) {

            /**
             * Add dragging class
             */
            $builder.addClass( classes.dragging );

            /**
             * @var {jQuery} Store the draging item
             */
            temp.$item = $builder.getItem( $( this ) );

            /**
             * Create draging preview
             */
            createMovingPreview();

            /**
             * @var {HTMLImageElement} Create an empty image for replacing the browser default.
             */
            const blankImage = new Image();
            blankImage.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            event.originalEvent.dataTransfer.setDragImage( blankImage, 0, 0 );
        } );

        /**
         * Handle dragend event, cleaning up if a drop is canceled
         */
        $builder.on( 'dragend', '[draggable="true"], [draggable]', function( event ) {
            $builder.removeClass( classes.dragging );
            $builder.find( `.${classes.dragover}` ).removeClass( classes.dragover );
            removeMovingPreview();
        } );

        /**
         * Add UI class for empty row or column
         */
        $builder.on( 'dragenter', `.${classes.row}.${classes.empty}, .${classes.column}.${classes.empty}`, function( event ) {
            $( this ).addClass( classes.dragover );
        } );

        /**
         * Remove UI class on leaving empty row or column
         */
        $builder.on( 'dragleave', `.${classes.row}.${classes.empty}, .${classes.column}.${classes.empty}`, function( event ) {
            $( this ).removeClass( classes.dragover );
        } );

        /**
         * Prevent default dragover event to allow for dropping
         */
        $builder.on( 'dragover', `.${classes.row}.${classes.empty}, .${classes.column}.${classes.empty}`, function( event ) {
            event.preventDefault();
        } );

        /**
         * Handle the drop event, move item and wrap if needed
         */
        $builder.on( 'drop', `.${classes.row}.${classes.empty}, .${classes.column}.${classes.empty}`, function( event ) {
            event.preventDefault();
            const $target = $( event.target );

            // Wrap element in column if droping on new row
            if ( $target.is( `.${classes.row}` ) ) {
                const $col = createColumn();
                emptyParents( temp.$item );
                $col.append( temp.$item );
                $target.append( $col );
                $target.removeClass( classes.empty );
            }

            // Else, just drop in column if less than max
            else if ( $target.is( `.${classes.column}` ) ) {

                const $rowColumns = $target.closest( `.${classes.row}` ).find( `.${classes.column}` );
                let canAddColumn = !args.maxColumns || args.maxColumns && $rowColumns.not( `.${classes.empty}` ).length < args.maxColumns;
                if ( canAddColumn ) {
                    emptyParents( temp.$item );
                    $target.append( temp.$item );
                    $target.removeClass( classes.empty );
                }
            }

            // Reset preview
            removeMovingPreview();

            // Create new placeholders
            createPlaceholders();
        } );

        /**
         * Attach preview element to mouse
         */
        $( document ).on( 'mousemove dragover', function( event ) {
            if ( temp.$preview ) {
                temp.$preview.css( {
                    top: ( event.clientY / $( window ).height() * 100 ) + '%',
                    left: ( event.clientX / $( window ).width() * 100 ) + '%'
                } );
            }
        } );

        /**
         * Get the builder item from target
         *
         * @param {jQuery} $target
         * @returns {jQuery}
         */
        $builder.getItem = function( $target ) {
            return $target.closest( `.${classes.item}` );
        };

        /**
         * Add an item to the builder
         *
         * @access public
         * @param {jQuery} $target
         * @returns {void}
         */
        $builder.addItem = function( $target ) {

            // Layout
            const $row = createRow();
            const $col = createColumn();
            const $item = createItem( $target );

            // Build
            $col.append( $item );
            $row.append( $col );

            // Add row to stage
            $builder.append( $row );

            // Create empty placeholders
            createPlaceholders();

            return $item;
        };

        /**
         * Remove an item from the builder
         *
         * @access public
         * @param {jQuery} $target
         * @returns {void}
         */
        $builder.removeItem = function( $target ) {
            const $item = $builder.getItem( $target );
            emptyParents( $item );
            $item.remove();
            createPlaceholders();
        };

        /**
         * Run plugin initiator
         */
        initiate();

        return $builder;
    };

} )( jQuery );
