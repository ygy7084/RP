import React from 'react';
import FileDownload from 'react-file-download';

/*
body에 대한 css와
react date picker 및 loader에 대한 css입니다.
 */
import style from '../main.css';


import {
    Header,
    Body,
    Left,
    Right,
    PriceChangeModal,
    GroupTickettingModal,
    CustomerFindingModal,
    LoaderModal,
    ErrorModal,
    ExtraFunctionModal,
} from '../components';

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded : false,
            theater : null,
            show : null,
            showtime : null,
            seats : [],
            reserved_seats:[],
            seats_picked : [],
            times : [],
            time_picked : null,
            price_picked: null,
            customers:[],
            customers_picked : [],
            PriceChangeModal_on : false,
            CustomerFindingModal_on : false,
            GroupTickettingModal_on : false,
            LoaderModal_on : false,
            LoaderModal_title : '',
            ErrorModal_on : false,
            ErrorModal_title : '',
            ExtraFunctionModal_on : false,

            autoPrint : true,
            autoCombine : true,
            reTickettingStart : false,
            preTickettingStart : false
        };
        this.datePick = this.datePick.bind(this);
        this.timePick = this.timePick.bind(this);
        this.loadSeats = this.loadSeats.bind(this);
        this.changePriceOn = this.changePriceOn.bind(this);
        this.changePrice = this.changePrice.bind(this);
        this.changePriceAll = this.changePriceAll.bind(this);
        this.findCustomers = this.findCustomers.bind(this);
        this.preTicketting = this.preTicketting.bind(this);
        this.preTickettingWithoutSeats = this.preTickettingWithoutSeats.bind(this);
        this.ticketting = this.ticketting.bind(this);
        this.pickSeat = this.pickSeat.bind(this);
        this.seats_reset = this.seats_reset.bind(this);
        this.chooseCustomer = this.chooseCustomer.bind(this);
        this.InfoOfSelectedSeats = this.InfoOfSelectedSeats.bind(this);
        this.groupTickettingModal = this.groupTickettingModal.bind(this);
        this.ticketExcel = this.ticketExcel.bind(this);
        this.getAllExcel = this.getAllExcel.bind(this);
        this.groupTicketting = this.groupTicketting.bind(this);
        this.tickettingWithoutCustomer = this.tickettingWithoutCustomer.bind(this);
        this.tickettingWithCustomer = this.tickettingWithCustomer.bind(this);
        this.extraFunctionModal = this.extraFunctionModal.bind(this);
        this.changePrintMode = this.changePrintMode.bind(this);
        this.changeCombineMode = this.changeCombineMode.bind(this);
        this.tickettingCenter = this.tickettingCenter.bind(this);
        this.interparkTicketting = this.interparkTicketting.bind(this);
        this.reTickettingStart = this.reTickettingStart.bind(this);
        this.reTicketting = this.reTicketting.bind(this);
    }
    componentDidMount() {
        let theater,show,showtime;
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'소월아트홀 - 옥토넛'
        });
        fetch('/api/theater/read',{
            method : 'GET'
        })
            .then(res =>{
                if(res.ok)
                    return res.json();
                else
                    return res.json().then(err => { throw err; })})
            .then(res => {
                for(let t of res.data)
                    if(t.name==='소월아트홀') {
                        theater = t;
                        break;
                    }

                fetch('/api/show/read',{
                    method : 'GET'
                })
                    .then(res =>{
                        if(res.ok)
                            return res.json();
                        else
                            return res.json().then(err => { throw err; })})
                    .then(res => {
                        for(let s of res.data)
                            if(s.name==='옥토넛') {
                                show = s;
                                break;
                            }

                        fetch('/api/showtime/read',{
                            method : 'GET'
                        })
                            .then(res =>{
                                if(res.ok)
                                    return res.json();
                                else
                                    return res.json().then(err => { throw err; })})
                            .then(res => {
                                for(let st of res.data)
                                    if(st.theater === theater._id && st.show === show._id) {
                                        showtime = st;
                                        break;
                                    }
                                this.setState({
                                    theater:theater,
                                    show:show,
                                    showtime:showtime,
                                    LoaderModal_on:false
                                });
                            })
                            .catch((err) => {
                                let message = err;
                                if(err.message && err.message!=='')
                                    message = err.message;
                                console.log(message);
                            });
                    })
                    .catch((err) => {
                        let message = err;
                        if(err.message && err.message!=='')
                            message = err.message;
                        console.log(message);
                    });


            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(message);
            });
    }
    chooseCustomer(mode, customers) {
        if(mode==='preTicket') {
            this.setState({
                preTickettingStart: true,
                customers_picked: customers});
            this.loadSeats(this.state.time_picked, true);
        }

            // return false;
            //좌석 설정해주는 창이 뜨도록!
            //this.preTickettingWithoutSeats(customers);
        else {
            for(let i of customers) {
                for(let seat of this.state.reserved_seats) {
                    if(!i.seat_position) break;
                    else {
                        if(seat.col===i.seat_position.col && seat.num===i.seat_position.num)
                            i.serialNum = seat.serialNum;
                    }
                }
            }
            this.setState({
                customers_picked: customers,
            });
        }
    }
    seats_reset() {
        if(this.state.seats_picked && this.state.seats_picked.length)
            this.setState({
                seats_picked : [],
                price_picked : null,
            });
        else
            this.setState({
                seats_picked: [],
                price_picked: null,
                customers: [],
                customers_picked: [],
            });
        if(this.state.reTickettingStart)
            this.reTickettingStart(false);
    }
    //완성
    groupTicketting(group_name, price, combine) {
        if(this.state.reTickettingStart || this.state.preTickettingStart)
            return false;

        const data = [];
        const source = '단체';

        for(let p of this.state.seats_picked) {
            let reservation = {
                input_date: new Date(),
                source : source,
                group_name: group_name,
                show_date: this.state.time_picked,
                seat_class: p.seat_class,
                seat_position: {
                    floor : p.floor,
                    col : p.col,
                    num : p.num
                },
                ticket_quantity: 1,
                ticket_price: price ? parseInt(price) : parseInt(p.price),
                theater: this.state.theater._id,
                show: this.state.show._id,
                printed:true,
                delivered:true
            };
            data.push(reservation);
        }
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'단체 발권 중'
        });
        let wrapper = {
            data : data
        };
        return fetch('/api/reservation/groupTicketting',{
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify(wrapper)
        })
            .then(res =>{
                if(res.ok)
                    return res.json();
                else
                    return res.json().then(err => { throw err; })})
            .then(res => {
                /*
                이따가 이 부분 다른 티켓 발권처리에도 다 넣고 상태(출력을 어떻게할 시 결정할 수 있도록!)
                 */
                let wrapper = {
                    data : data,
                    combine : combine
                };

                if(this.state.autoPrint)
                    fetch('http://localhost:8081/ticket', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then((res) => res.json())
                        .then((res)=>{
                            this.loadSeats(this.state.time_picked);
                        })
                        .catch((err) => {
                            let message = err;
                            if(err.message && err.message!=='')
                                message = err.message;
                            console.log(err);

                            fetch('/api/ticket/print', {
                                method:'POST',
                                headers:{'Content-Type':'application/json'},
                                body:JSON.stringify(wrapper)
                            })
                                .then(res=> res.blob())
                                .then((blob) => {
                                    FileDownload(blob, 'ticket.pdf');
                                    this.setState({
                                        LoaderModal_on:false,
                                        ErrorModal_on:true,
                                        ErrorModal_title:'프린터 출력이 불가능합니다. PDF 모드로 변경해주세요.'
                                    });
                                });
                            //알수없는에러에 대한 처리도 필요할 듯?
                        });
                else
                    fetch('/api/ticket/print', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then(res=> res.blob())
                        .then((blob) => {
                            FileDownload(blob, 'ticket.pdf');
                            this.loadSeats(this.state.time_picked);
                        });

            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(err);

                this.setState({
                    LoaderModal_on:false,
                    ErrorModal_on:true,
                    ErrorModal_title:message
                });
            });
    }
    reTicketting(combine) {
        if(this.state.reTickettingStart || this.state.preTickettingStart)
            return false;

        let data = [];

        for(let p of this.state.seats_picked) {
            let price = p.price;
            if(!price) {
                price = p.seat_class==='VIP' ? '50000' : '40000';
            }
            let reservation = {
                show_date: this.state.time_picked,
                seat_class: p.seat_class,
                seat_position: {
                    floor : p.floor,
                    col : p.col,
                    num : p.num
                },
                ticket_quantity: 1,
                ticket_price: parseInt(price),
            };
            data.push(reservation);
        }
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'재발권 중'
        });
        let wrapper = {
            data : data,
            combine :combine
        };
        if(this.state.autoPrint)
            fetch('http://localhost:8081/ticket', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(wrapper)
            })
                .then((res) => res.json())
                .then((res)=>{
                    this.loadSeats(this.state.time_picked);
                })
                .catch((err) => {
                    let message = err;
                    if(err.message && err.message!=='')
                        message = err.message;
                    console.log(err);

                    fetch('/api/ticket/print', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then(res=> res.blob())
                        .then((blob) => {
                            FileDownload(blob, 'ticket.pdf');
                            this.setState({
                                LoaderModal_on:false,
                                ErrorModal_on:true,
                                ErrorModal_title:'프린터 출력이 불가능합니다. PDF 모드로 변경해주세요.'
                            });
                        });
                    //알수없는에러에 대한 처리도 필요할 듯?
                });
        else
            fetch('/api/ticket/print', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(wrapper)
            })
                .then(res=> res.blob())
                .then((blob) => {
                    FileDownload(blob, 'ticket.pdf');
                    this.loadSeats(this.state.time_picked);
                });
    }
    tickettingWithoutCustomer(combine) {

        let data = [];
        let source = '현장';

        for(let p of this.state.seats_picked) {
            let reservation = {
                input_date: new Date(),
                source : source,
                show_date: this.state.time_picked,
                seat_class: p.seat_class,
                seat_position: {
                    floor : p.floor,
                    col : p.col,
                    num : p.num
                },
                ticket_quantity: 1,
                ticket_price: parseInt(p.price),
                theater: this.state.theater._id,
                show: this.state.show._id,
                printed:true,
                delivered:true
            };
            data.push(reservation);
        }
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'고객 미지정 발권 중'
        });
        let wrapper = {
            data : data
        };
        return fetch('/api/reservation/tickettingWithoutCustomer',{
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify(wrapper)
        })
            .then(res =>{
                if(res.ok)
                    return res.json();
                else
                    return res.json().then(err => { throw err; })})
            .then(res => {
                //
                let wrapper = {
                    data : data,
                    combine :combine
                };
                if(this.state.autoPrint)
                    fetch('http://localhost:8081/ticket', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then((res) => res.json())
                        .then((res)=>{
                            this.loadSeats(this.state.time_picked);
                        })
                        .catch((err) => {
                            let message = err;
                            if(err.message && err.message!=='')
                                message = err.message;
                            console.log(err);

                            fetch('/api/ticket/print', {
                                method:'POST',
                                headers:{'Content-Type':'application/json'},
                                body:JSON.stringify(wrapper)
                            })
                                .then(res=> res.blob())
                                .then((blob) => {
                                    FileDownload(blob, 'ticket.pdf');
                                    this.setState({
                                        LoaderModal_on:false,
                                        ErrorModal_on:true,
                                        ErrorModal_title:'프린터 출력이 불가능합니다. PDF 모드로 변경해주세요.'
                                    });
                                });
                            //알수없는에러에 대한 처리도 필요할 듯?
                        });
                else
                    fetch('/api/ticket/print', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then(res=> res.blob())
                        .then((blob) => {
                            FileDownload(blob, 'ticket.pdf');
                            this.loadSeats(this.state.time_picked);
                        });

            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(err);

                this.setState({
                    LoaderModal_on:false,
                    ErrorModal_on:true,
                    ErrorModal_title:message
                });
            });
    }
    tickettingWithCustomer(combine) {

        let seats_picked = JSON.parse(JSON.stringify(this.state.seats_picked));
        let customers_picked = JSON.parse(JSON.stringify(this.state.customers_picked));
        let data = [];
        for (let seat of seats_picked) {
            for(let customer of customers_picked) {
                if(!customer.seat_position && seat.seat_class===customer.seat_class) {
                    customer.seat_position = {
                        floor:seat.floor,
                        col:seat.col,
                        num:seat.num
                    };
                    break;
                }
            }
        }

        for(let customer of customers_picked) {
            let reservation = {
                _id:customer._id,
                input_date: new Date(),
                seat_position: customer.seat_position,
                show_date: this.state.time_picked,
                seat_class: customer.seat_class,
                ticket_price: customer.ticket_price,
                printed:true,
                delivered:true
            };
            data.push(reservation);
        }

        /*
         input_date: new Date(),
         source : source,
         group_name: group_name,
         show_date: this.state.time_picked,
         seat_class: p.seat_class,
         seat_position: {
         floor : p.floor,
         col : p.col,
         num : p.num
         },
         ticket_quantity: 1,
         ticket_price: price ? parseInt(price) : parseInt(p.price),
         theater: this.state.theater._id,
         show: this.state.show._id,
         printed:true,
         delivered:true


         */

        this.setState({
            LoaderModal_on: true,
            LoaderModal_title: '고객 지정 발권 중'
        });
        let wrapper = {
            data : data
        };
        return fetch('/api/reservation/tickettingWithCustomer', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(wrapper)
        })
            .then(res => {
                if (res.ok)
                    return res.json();
                else
                    return res.json().then(err => {
                        throw err;
                    })
            })
            .then(res => {
                let wrapper = {
                    data : data,
                    combine :combine
                };
                if(this.state.autoPrint)
                    fetch('http://localhost:8081/ticket', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then((res) => res.json())
                        .then((res)=>{
                            this.loadSeats(this.state.time_picked);
                        })
                        .catch((err) => {
                            let message = err;
                            if(err.message && err.message!=='')
                                message = err.message;
                            console.log(err);

                            fetch('/api/ticket/print', {
                                method:'POST',
                                headers:{'Content-Type':'application/json'},
                                body:JSON.stringify(wrapper)
                            })
                                .then(res=> res.blob())
                                .then((blob) => {
                                    FileDownload(blob, 'ticket.pdf');
                                    this.setState({
                                        LoaderModal_on:false,
                                        ErrorModal_on:true,
                                        ErrorModal_title:'프린터 출력이 불가능합니다. PDF 모드로 변경해주세요.'
                                    });
                                });
                            //알수없는에러에 대한 처리도 필요할 듯?
                        });
                else
                    fetch('/api/ticket/print', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then(res=> res.blob())
                        .then((blob) => {
                            FileDownload(blob, 'ticket.pdf');
                            this.loadSeats(this.state.time_picked);
                        });

            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(err);

                this.setState({
                    LoaderModal_on:false,
                    ErrorModal_on:true,
                    ErrorModal_title:message
                });
            });

    }
    preTicketting(combine) {
        if(this.state.reTickettingStart || this.state.preTickettingStart)
            return false;
        /*
        차후에 두개의 예약을 묶어야 한다.
        고객 데이터 없는 이 Reservation과
        고객 데이터만 있는 Reservation을 합쳐야 하는 과정이 필요하다.
         */
        let data = [];

        for(let p of this.state.seats_picked) {
            let reservation = {
                input_date: new Date(),
                show_date: this.state.time_picked,
                seat_class: p.seat_class,
                seat_position: {
                    floor : p.floor,
                    col : p.col,
                    num : p.num
                },
                ticket_quantity: 1,
                ticket_price: parseInt(p.price),
                theater: this.state.theater._id,
                show: this.state.show._id,
                printed:true,
                delivered:false
            };
            data.push(reservation);
        }
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'사전 발권 중'
        });
        let wrapper = {
            data : data
        };
        return fetch('/api/reservation/preTicketting',{
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify(wrapper)
        })
            .then(res =>{
                if(res.ok)
                    return res.json();
                else
                    return res.json().then(err => { throw err; })})
            .then(res => {
                //
                let wrapper = {
                    data : data,
                    combine :combine
                };
                if(this.state.autoPrint)
                    fetch('http://localhost:8081/ticket', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then((res) => res.json())
                        .then((res)=>{
                            this.loadSeats(this.state.time_picked);
                        })
                        .catch((err) => {
                            let message = err;
                            if(err.message && err.message!=='')
                                message = err.message;
                            console.log(err);

                            fetch('/api/ticket/print', {
                                method:'POST',
                                headers:{'Content-Type':'application/json'},
                                body:JSON.stringify(wrapper)
                            })
                                .then(res=> res.blob())
                                .then((blob) => {
                                    FileDownload(blob, 'ticket.pdf');
                                    this.setState({
                                        LoaderModal_on:false,
                                        ErrorModal_on:true,
                                        ErrorModal_title:'프린터 출력이 불가능합니다. PDF 모드로 변경해주세요.'
                                    });
                                });
                            //알수없는에러에 대한 처리도 필요할 듯?
                        });
                else
                    fetch('/api/ticket/print', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then(res=> res.blob())
                        .then((blob) => {
                            FileDownload(blob, 'ticket.pdf');
                            this.loadSeats(this.state.time_picked);
                        });
            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(err);

                this.setState({
                    LoaderModal_on:false,
                    ErrorModal_on:true,
                    ErrorModal_title:message
                });
            });
    }
    preTickettingWithoutSeats(customers_picked) {
        if(!customers_picked)
            return null;
        else {
            let data = [];

            for(let customer of customers_picked) {
                let reservation = {
                    _id:customer._id,
                    printed: true
                };
                data.push(reservation);
            }

            this.setState({
                LoaderModal_on: true,
                LoaderModal_title: '발권 중'
            });
            let wrapper = {
                data : data
            };
            return fetch('/api/reservation/ticketting', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(wrapper)
            })
                .then(res => {
                    if (res.ok)
                        return res.json();
                    else
                        return res.json().then(err => {
                            throw err;
                        })
                })
                .then(res => {
                    this.loadSeats(this.state.time_picked);
                })
                .catch((err) => {
                    let message = err;
                    if (err.message && err.message !== '')
                        message = err.message;
                    console.log(message);
                });
        }
    }
    ticketting(source) {
        let seats_picked = JSON.parse(JSON.stringify(this.state.seats_picked));
        let customers_picked = JSON.parse(JSON.stringify(this.state.customers_picked));
        let data = [];
        for (let seat of seats_picked) {
            for(let customer of customers_picked) {
                if(!customer.seat_position && seat.seat_class===customer.seat_class) {
                    customer.seat_position = {
                        floor:seat.floor,
                        col:seat.col,
                        num:seat.num
                    };
                    break;
                }
            }
        }

        for(let customer of customers_picked) {
            let reservation = {
                _id:customer._id,
                source:source,
                input_date: new Date(),
                seat_position: customer.seat_position,
                printed: true,
                show_date:this.state.time_picked,
                seat_class:customer.seat_class,
                seat_price:customer.seat_price,
            };
            data.push(reservation);
        }

        this.setState({
            LoaderModal_on: true,
            LoaderModal_title: '발권 중'
        });
        let wrapper = {
            data : data
        };
        return fetch('/api/reservation/ticketting', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(wrapper)
        })
            .then(res => {
                if (res.ok)
                    return res.json();
                else
                    return res.json().then(err => {
                        throw err;
                    })
            })
            .then(res => {
                this.loadSeats(this.state.time_picked);
            })
            .catch((err) => {
                let message = err;
                if (err.message && err.message !== '')
                    message = err.message;
                console.log(message);
            });
    }
    findCustomers(input) {
        if(!this.state.time_picked)
            return false;

        this.setState({
            seats_picked: [],
            price_picked: null,
            customers: [],
            customers_picked: [],
            LoaderModal_on:true,
            LoaderModal_title:'검색 중'
        });

        fetch('/api/reservation/read/theater/'+this.state.theater._id+'/show/'+this.state.show._id+'/date/'+this.state.time_picked,{
            method : 'GET'
        })
            .then(res =>{
                if(res.ok)
                    return res.json();
                else
                    return res.json().then(err => { throw err; })})
            .then(res => {
                const customers = [];

                if(Number(input))
                    for(let r of res.data) {
                        if (input === r.customer_phone && !r.printed)
                            customers.push(r);
                    }
                else
                    for(let r of res.data) {
                        if (input === r.customer_name && !r.printed)
                            customers.push(r);
                    }


                fetch('/api/seatsSerial/'+this.state.time_picked, {method:'GET'})
                    .then(res => {
                        if(res.ok)
                            return res.json();
                        else
                            return res.json().then(err => { throw err; })})

                    .then(res => {

                        if (res.data && res.data[0] && res.data.length) {
                            const serialSeats = res.data[0].seats;

                            for (let serial of serialSeats) {

                                for (let i of customers){
                                    if(i.seat_position && i.seat_position.col&&i.seat_position.num) {
                                        if (i.seat_position.col === serial.col && i.seat_position.num === serial.num) {
                                            i.serialNum = serial.serialNum;
                                        }
                                    }
                                }
                            }
                        }

                        this.setState({
                            customers: customers,
                            LoaderModal_on: false,
                            CustomerFindingModal_on: true
                        });
                    })
            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(message);
            });

    }
    changePriceOn(seat) {
        if(!this.state.customers_picked || !this.state.customers_picked.length)
            this.setState({
                price_picked:seat,
                PriceChangeModal_on:true
            });
    }
    changePrice(price) {
        let seats_picked = this.state.seats_picked;
        let price_picked = this.state.price_picked;
        for(let i in seats_picked) {
            if(seats_picked[i] === price_picked) {
                this.setState((state) => {
                    state.seats_picked[i].price = price;
                    state.PriceChangeModal_on = false;
                });
                return;
            }
        }
        this.setState({
            PriceChangeModal_on : false
        });
    }
    changePriceAll(ratio) {
        let seats_picked = JSON.parse(JSON.stringify(this.state.seats_picked));
        for(let seat of seats_picked) {
            if ( seat.seat_class === 'VIP')
                seat.price = 50000*ratio;
            else if(seat.seat_class === 'R')
                seat.price = 40000*ratio;
        }
        this.setState({
            seats_picked:seats_picked,
            PriceChangeModal_on:false
        });
    }
    groupTickettingModal(on){
        if(this.state.reTickettingStart)
            return false;

        if(this.state.seats_picked && this.state.seats_picked.length && on)
            this.setState({
                GroupTickettingModal_on : true
            });
        else
            this.setState({
                GroupTickettingModal_on : false
            });
    }
    extraFunctionModal(on) {


        if(this.state.loaded && on)
            this.setState({
                ExtraFunctionModal_on : true
            });
        else
            this.setState({
                ExtraFunctionModal_on : false
            });
    }
    datePick(date) {
        /*
            날짜 선택
         */

        // 공연 스케쥴
        let schedules = this.state.showtime.schedule;

        // 선택한 날짜에 이뤄지는 공연의 스케쥴을 불러온다.
        // times에는 시간 정보 뿐 아니라 날짜 정보도 있는 Date 객체를 저장한다.
        let times = [];
        for(let s of schedules) {
            let schedule_date = new Date(s.date);
            if( schedule_date.toLocaleDateString() === date.toLocaleDateString())
                times.push(schedule_date);
        }

        // 공연 시간 로드 및 좌석, 구매자 정보 초기화
        this.setState({
            loaded:false,
            times : times,
            seats:[],
            seats_picked:[],
            time_picked : null,
            price_picked: null,
            customers:[],
            customers_picked : [],
        });

        //선택한 날짜와 시간에 공연 스케쥴 존재 시 첫째 공연 스케쥴 자동 선택
        if(times.length>0)
            this.timePick(times[0].getTime());
    }
    timePick(time) {
        this.loadSeats(time);
    }
    reTickettingStart(boolean) {
        this.setState({reTickettingStart:boolean});
        this.loadSeats(this.state.time_picked);
    }
    loadSeats(time, pre) {
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:new Date(time).toLocaleString()
        });

        if(this.state.preTickettingStart || pre) {
            return fetch('/api/seats/pre/showtime/'+this.state.showtime._id+'/date/'+time,{
                method : 'GET'
            })
                .then(res =>{
                    if(res.ok)
                        return res.json();
                    else
                        return res.json().then(err => { throw err; })})
                .then(res => {

                    console.log(res.data.printed_seats);
                    const seats = res.data.printed_seats;
                    this.setState({
                        loaded:true,
                        time_picked:time,
                        seats:seats,
                        seats_picked:[],
                        price_picked: null,
                        LoaderModal_on:false
                    });
                })
                .catch((err) => {
                    let message = err;
                    if(err.message && err.message!=='')
                        message = err.message;
                    console.log(message);
                });
        }
        else
            return fetch('/api/seats/showtime/'+this.state.showtime._id+'/date/'+time,{
                method : 'GET'
            })
                .then(res =>{
                    if(res.ok)
                        return res.json();
                    else
                        return res.json().then(err => { throw err; })})
                .then(res => {
                    /*
                    가격 정보를 저장한다.
                     */
                    for(let seat of res.data.not_reserved_seats) {
                        if(seat.seat_class==='VIP')
                            seat.price = 50000;
                        else if(seat.seat_class==='R')
                            seat.price = 40000;
                        else
                            throw new Error('좌석 등급을 식별할 수 없습니다. - '+seat.seat_class);
                    }

                    let seats;
                    if(this.state.reTickettingStart)
                        seats = res.data.reserved_seats;
                    else
                        seats = res.data.not_reserved_seats;

                    let reserved_seats = res.data.reserved_seats;

                    fetch('/api/seatsSerial/'+time, {method:'GET'})
                        .then(res => {
                            if(res.ok)
                                return res.json();
                            else
                                return res.json().then(err => { throw err; })})

                        .then(res => {
                            console.log(res.data[0]);

                            if(res.data && res.data[0]) {
                                if (res.data && res.data.length) {
                                    const serialSeats = res.data[0].seats;

                                    for (let serial of serialSeats) {

                                        for (let i of seats) {
                                            if (i.col === serial.col && i.num === serial.num) {
                                                i.serialNum = serial.serialNum;
                                            }
                                        }
                                    }

                                }
                                console.log(reserved_seats);
                                if (reserved_seats && reserved_seats.length) {
                                    const serialSeats = res.data[0].seats;

                                    for (let serial of serialSeats) {

                                        for (let i of reserved_seats) {
                                            if (i.col === serial.col && i.num === serial.num) {
                                                i.serialNum = serial.serialNum;
                                            }
                                        }
                                    }

                                }
                            }
                            this.setState({
                                loaded:true,
                                time_picked:time,
                                seats:seats,
                                reserved_seats : reserved_seats,
                                seats_picked:[],
                                price_picked: null,
                                customers: [],
                                customers_picked: [],
                                LoaderModal_on:false
                            });
                            })
                    })
                .catch((err) => {
                    let message = err;
                    if(err.message && err.message!=='')
                        message = err.message;
                    console.log(message);
                });
    }
    pickSeat(seats) {
        let seats_picked = JSON.parse(JSON.stringify(this.state.seats_picked));

        if(Array.isArray(seats)) {
            let seats_cleaned = [];
            for(let s of seats) {
                let temp = true;
                for(let s2 of seats_picked) {
                    if (s.floor === s2.floor && s.col === s2.col && s.num === s2.num){
                        temp = false;
                        break;
                    }
                }
                if(temp===true)
                    seats_cleaned.push(s);
            }
            for(let i of seats_cleaned)
                seats_picked.push(i);

        }
        else {
            let seat = seats;
            let index = this.state.seats_picked.findIndex((s) => {
                if (s.x === seat.x && s.y === seat.y)
                    return true;
            });

            if(index>-1)
                seats_picked.splice(index,1);
            else {
                console.log('original seat');
                console.log(seat);
                seats_picked.push(seat);
            }
        }
        /*
        좌석의 기본 정보를 직접 변경하지 않는다.
        기본 정보는 보존한다.
         */
        this.setState({seats_picked:JSON.parse(JSON.stringify(seats_picked))});
    }
    InfoOfSelectedSeats(){

        /*
         좌석이 로드 되어 있지 않거나 사용가능한 좌석이 없을 경우
         */

        if( !this.state.seats||
            !this.state.seats.length)
            return {
                OK: false
            };
        else {
            //옮겨야해
            let numOfVIP = 0;
            let numOfR = 0;
            for(let s of this.state.seats_picked) {
                if(s.seat_class==="VIP")
                    numOfVIP++;
                else if(s.seat_class==="R")
                    numOfR++;
            }

            if(this.state.customers_picked && this.state.customers_picked.length) {
                let numOfVIP_customers = 0;
                let numOfR_customers = 0;
                for(let s of this.state.customers_picked) {
                    if(!s.seat_position) {
                        if (s.seat_class === "VIP")
                            numOfVIP_customers++;
                        else if (s.seat_class === "R")
                            numOfR_customers++;
                    }
                }
                let errOfVIP = numOfVIP_customers-numOfVIP;
                let errOfR   = numOfR_customers-numOfR;

                return {
                    numOfVIP : numOfVIP,
                    numOfR : numOfR,
                    numOfVIP_customers : numOfVIP_customers,
                    numOfR_customers : numOfR_customers,
                    errOfVIP : errOfVIP,
                    errOfR : errOfR,
                    OK : errOfVIP===0 && errOfR===0
                }
            }
            else
                return {
                    numOfVIP : numOfVIP,
                    numOfR : numOfR,
                    OK : this.state.seats_picked && this.state.seats_picked.length!==0
                };
        }
    }
    ticketExcel(source, price) {
        let data = [];
        for(let p of this.state.seats_picked) {
            let reservation = {
                source: source,
                show_date: this.state.time_picked,
                seat_class: p.seat_class,
                seat_position: {
                    col: p.col,
                    num: p.num
                },
                ticket_quantity: 1,
                ticket_price: price ? parseInt(price) : parseInt(p.price),
            };
            data.push(reservation);
        }
        let wrapper = {
            data : data
        };
        return fetch('/api/excel/ticketExcel',{
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify(wrapper)
        })  .then(res=> res.blob())
            .then((blob) => {
                FileDownload(blob, 'tickets.xlsx');
            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(message);
            });
    }
    getAllExcel() {
        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'엑셀 출력 중'
        });
        return fetch('/api/excel/showtime/'+this.state.showtime._id+'/date/'+this.state.time_picked,{
            method : 'GET'
        })
            .then(res=> res.blob())
            .then((blob) => {
                this.setState({
                    LoaderModal_on:false,
                });
                FileDownload(blob, 'reservations.xlsx');
                this.loadSeats(this.state.time_picked);

            })
            .catch((err) => {
                this.setState({
                    LoaderModal_on:false,
                });
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(message);
            });
    }
    changePrintMode(boolean) {
        this.setState({autoPrint:boolean});
    }
    changeCombineMode(boolean) {
        this.setState({autoCombine:boolean});
    }
    tickettingCenter(cb) {
        let combine = false;
        if(this.state.seats_picked.length>0 && this.state.autoCombine && this.state.seats_picked.length<=10) {
            combine = true;
            const firstSeatClass = this.state.seats_picked[0].seat_class;
            const firstSeatPrice = this.state.seats_picked[0].price;
            for(let seat of this.state.seats_picked) {
                if (seat.seat_class !== firstSeatClass || seat.price !== firstSeatPrice)
                    combine = false;
            }
        }
        cb(combine);
    }
    interparkTicketting() {
        if(!this.state.loaded || this.state.reTickettingStart)
            return false;

        this.setState({
            LoaderModal_on:true,
            LoaderModal_title:'인터파크 발권 중'
        });
        return fetch('/api/reservation/interpark/showtime/'+this.state.showtime._id+'/date/'+this.state.time_picked,{
            method : 'GET'
        })
            .then(res =>{
                if(res.ok)
                    return res.json();
                else
                    return res.json().then(err => { throw err; })})
            .then(res => {
                let wrapper = {
                    data : res.data,
                    combine :false
                };

                fetch('/api/ticket/print', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body:JSON.stringify(wrapper)
                    })
                        .then(res=> res.blob())
                        .then((blob) => {
                            FileDownload(blob, 'ticket.pdf');
                            this.loadSeats(this.state.time_picked);
                        });
            })
            .catch((err) => {
                let message = err;
                if(err.message && err.message!=='')
                    message = err.message;
                console.log(message);
            });
    }
    render() {
        return (
            <div>
                <Header
                    title={'바다 탐험대 옥토넛'}
                    onDatePick={this.datePick}
                    onTimePick={this.timePick}
                    Times={this.state.times}/>
                <Body>
                    <Left
                        seats_picked={this.state.seats_picked}
                        seats = {this.state.seats}
                        pickSeat = {this.pickSeat}
                        backgroundSize = {{width:650,height:650}}/>
                    <Right
                        findCustomers={this.findCustomers}
                        customers_picked={this.state.customers_picked}
                        seats_picked={this.state.seats_picked}
                        changePriceOn={this.changePriceOn}
                        resetSeats={this.seats_reset}
                        ticketting={this.ticketting}
                        preTicketting={this.preTicketting}
                        seatsInfo={this.InfoOfSelectedSeats()}
                        tickettingWithoutCustomer={this.tickettingWithoutCustomer}
                        tickettingWithCustomer={this.tickettingWithCustomer}
                        extraFunctionModal={this.extraFunctionModal}
                        tickettingCenter={this.tickettingCenter}
                        reTicketting={this.reTicketting}
                        reTickettingStart={this.state.reTickettingStart}/>

                </Body>


                <GroupTickettingModal
                    groupTicketting={this.groupTicketting}
                    tickettingCenter={this.tickettingCenter}
                    ticketExcel={this.ticketExcel}
                    on={this.state.GroupTickettingModal_on}
                    groupTickettingModal={this.groupTickettingModal}
                />
                <CustomerFindingModal
                    chooseCustomers={this.chooseCustomer}
                    data={this.state.customers}
                    on={this.state.CustomerFindingModal_on}
                    onClose={()=>{this.setState({CustomerFindingModal_on:false})}}
                />
                <PriceChangeModal
                    on={this.state.PriceChangeModal_on}
                    onClose={()=>{this.setState({PriceChangeModal_on:false})}}
                    price_picked={this.state.price_picked}
                    changePrice={this.changePrice}
                    changePriceAll={this.changePriceAll}
                    basePrice={this.state.price_picked ?
                        this.state.price_picked.seat_class==='VIP' ? 50000 : 40000
                        : 0}
                />
                <LoaderModal
                    on={this.state.LoaderModal_on}
                    title={this.state.LoaderModal_title}
                />
                <ErrorModal
                    on={this.state.ErrorModal_on}
                    title={this.state.ErrorModal_title}
                    onClose={()=>{
                        this.setState({ErrorModal_on:false});
                        if(this.state.time_picked)
                            this.loadSeats(this.state.time_picked);
                    }}
                />
                <ExtraFunctionModal
                    on={this.state.ExtraFunctionModal_on}
                    extraFunctionModal={this.extraFunctionModal}
                    getAllExcel={this.getAllExcel}
                    changePrintMode={this.changePrintMode}
                    autoPrint={this.state.autoPrint}
                    changeCombineMode={this.changeCombineMode}
                    autoCombine={this.state.autoCombine}
                    groupTickettingModal={this.groupTickettingModal}
                    interparkTicketting={this.interparkTicketting}
                    reTickettingStart={this.reTickettingStart}
                />

            </div>
        )
    }
}

export default Main;