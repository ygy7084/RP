import React from 'react';

class Table extends React.Component {
    constructor(props) {
        super(props);
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
            <div className='table-responsive'>
                <table className="table table-hover">
                    <thead>
                        <tr>
                            {filters.map((p) => {return <th key={p}>{p}</th>})}
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.data.map((d) => {
                            return(
                                <tr key={JSON.stringify(d)}>
                                    {filters.map((p)=> {return <td key={p}>{d[p]}</td>})}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }
}

export default Table;