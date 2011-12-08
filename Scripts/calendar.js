$(function () {
    var parseTime = function(val) {
        if (!isNaN(val))
            // add minutes to numeric value otherwise it will be interpreted as a date
            val = val + ':00'; 
        return Date.parse(val);
    };
    
    window.Event = Backbone.Model;

    window.EventList = Backbone.Collection.extend({
            model: Event,

            localStorage: new Store('calendar'),

            comparator: function(event) {
                return Date.parse(event.get('date') + ' ' + event.get('time')).getTime();
            }
        });

    window.Events = new EventList;

    window.EventView = Backbone.View.extend({
            tagName: 'tr',
            
            template: _.template($('#item-template').html()),

            events: {
                'click span.remove-event': 'clear',
                'dblclick td.time': 'editTime',
                'dblclick td.description': 'editText'
            },

            initialize: function() {
                this.model.bind('change', this.render, this);
                this.model.bind('destroy', this.remove, this);
            },

            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                this.timeInput = this.$('.time-input');
                this.timeInput.bind('blur', _.bind(this.closeTime, this))
                              .val(this.model.get('time'));
                this.textInput = this.$('.text-input');
                this.textInput.bind('blur', _.bind(this.closeText, this))
                              .val(this.model.get('text'));
                return this;
            },

            editTime: function() {
                $('.time', this.el).addClass('editing');
                this.timeInput.focus(); 
            },

            editText: function() {
                $('.description', this.el).addClass('editing');
                this.textInput.focus();
            },

            closeTime: function() {
                var dt = parseTime(this.timeInput.val());
                if (dt) {
                    this.timeInput.val(dt.toString('h:mm tt'));
                    this.model.save({ time: this.timeInput.val() });
                    $(this.el).removeClass('editing');
                }
                else {
                    this.timeInput.addClass('error');
                    this.timeInput.one('focus', function() {
                        $(this).removeClass('error');
                    });
                }
            },

            closeText: function() {
                this.model.save({text: this.textInput.val()});
                $(this.el).removeClass("editing");
            },

            remove: function() {
                $(this.el).remove();
            },

            clear: function() {
                this.model.destroy();
            }
        });

    window.AppView = Backbone.View.extend({
            el: $('#calendarApp'),

            events: {
                'click .row .span4 input': 'create',
                'click #cancelBtn': 'cancelCreate',
                'click #createBtn': 'createNew'
            },

            initialize: function() {
                $('#datepicker').datepicker({
                    inline: true,
                    onSelect: function(dateText) {
                        App.filter(Date.parse(dateText));
                    }
                });
                
                $('#startTime').blur(function () {
                    var dt = parseTime($(this).val());
                    $(this).val(dt ? dt.toString('h:mm tt') : Date.parse('12:00').toString('h:mm tt'));
                });
                
                Events.bind('add', this.addOne, this);
                Events.bind('reset', this.getForToday, this);
                
                Events.fetch();
            },
            
            create: function () {
                $('#eventList').hide();
                $('#newEvent').show();
            },
            
            cancelCreate: function () {
                $('#startTime').val('');
                $('#eventDescription').val('');
                $('#newEvent').hide();
                $('#eventList').show();
            },
            
            createNew: function () {
                var startTime = $('#startTime').val();
                var description = $('#eventDescription').val();
                var date = this.selectedDate.toString('dd.MM.yyyy');
                if (startTime && description) {
                    Events.create({
                            date: date,
                            time: startTime,
                            text: description
                        });
                    this.cancelCreate();
                }
            },
            
            addOne: function (event) {
                var view = new EventView({ model: event });
                this.$('#eventList').append(view.render().el);
            },
            
            getForToday: function() {
                this.filter(Date.today());
            },
            
            filter: function (date) {
                this.selectedDate = date;
                this.$('#eventList').empty();
                _.each(
                    Events.filter(function(event) {
                        return date.equals(Date.parse(event.get('date')));
                    }), this.addOne);
            }
        });

    window.App = new AppView;
});