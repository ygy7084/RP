import React from 'react';

class ClickableTable extends React.Component {
    constructor(props) {
        super(props);
        this.rowClick = this.rowClick.bind(this);
    }
    rowClick(_id) {
       if(this.props.onClick)
           this.props.onClick(_id);
    }
    render() {


        let filters = ['index'];

        if(this.props.filters && this.props.filters.length !==0)
            filters = filters.concat(this.props.filters);
        else
            for(let d in this.props.data[0])
                filters.push(d);
        let i=0;

        this.props.data.map((d) => {
            d.index = ++i;
        });

        return (
            <table className="table table-hover">
                <thead>
                    <tr>
                        {filters.map((p) => {return <th key={p}>{p}</th>})}
                    </tr>
                </thead>
                <tbody>
                    {this.props.data.map((d) => {
                        return(
                            <tr key={JSON.stringify(d)} className={this.props.clicked ? this.props.clicked._id===d._id ? 'info' : null : null} onClick={() => {this.rowClick(d)}}>
                                {filters.map((p)=> {return <td key={p}>{d[p]}</td>})}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        )
    }
}

export default ClickableTable;