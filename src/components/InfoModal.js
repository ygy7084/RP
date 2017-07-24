import React from 'react';

class InfoModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            check_delete : '삭제'
        };
        this.delete = this.delete.bind(this);
        this.exit = this.exit.bind(this);
    }
    delete() {
        if(this.state.check_delete==='삭제')
            this.setState({check_delete:'삭제 확인'});
        else if(this.state.check_delete==='삭제 확인') {
            this.setState({check_delete:'삭제'});
            this.props.onDelete();
            $('#InfoModal').modal('hide');
        }
    }
    exit() {
        this.setState({
            check_delete : '삭제'
        });
    }
    render() {
        return (
            <div className="modal fade" id='InfoModal' tabIndex="-1" role="dialog">
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
                            <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.exit}>종료</button>
                            <button type="button" className="btn btn-primary" onClick={this.delete}>{this.state.check_delete}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default InfoModal;