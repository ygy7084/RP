import React from 'react';

class ExcelModal extends React.Component {
    constructor(props) {
        super(props);
        this.save = this.save.bind(this);
    }
    save() {
        this.props.onSave();
        $('#ExcelModal').modal('hide');
    }
    render() {
        return (
            <div className="modal fade" id='ExcelModal' tabIndex="-1" role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 className="modal-title">{this.props.title}</h4>
                        </div>
                        <div className="modal-body">
                            {this.props.children}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal">종료</button>
                            <button type="button" className="btn btn-primary" onClick={this.save}>저장</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ExcelModal;