import React from 'react';
import Highlight from 'react-highlighter';
import { Accordion, Alert, Table, Panel } from 'react-bootstrap';
import { Treds } from './TredTable';

const seqStyle = {
  fontFamily: '"Lucida Console", Monaco, monospace',
  fontSize: '10px',
};

const matchStyle = {
  backgroundColor: 'lightslategrey',
  color: 'white',
};

const TredparseResults = React.createClass({
  propTypes: {
    content: React.PropTypes.string,
    tred: React.PropTypes.string,
  },

  getStatement(calls) {
    const tred = this.props.tred;
    const tr = Treds[tred];
    const label = calls[`${tred}.label`];
    let status;

    if (label === 'ok') {
      status = 'success';
    } else if (label === 'prerisk') {
      status = 'warning';
    } else if (label === 'risk') {
      status = 'danger';
    }
    const inferredGender = calls['inferredGender'];

    return (
      <div style={{ fontSize: '24px' }}>
        <Alert bsStyle={ status }>
          { tred } alleles: { calls[`${tred}.1`] } / { calls[`${tred}.2`] } { tr.repeat }s
          <div>Disease status: { label } - <span style={{ color: 'grey' }}>
            <i>Prob(disease)</i>={ Math.round(calls[`${tred}.PP`], 3) }</span>
          </div>
          { inferredGender === 'Unknown' ? null : <div>Inferred gender: { inferredGender }</div> }
        </Alert>
      </div>
    );
  },

  formatReads(reads, motif) {
    const repeat = motif.replace('N', '.');
    const regex = new RegExp(`(${repeat}){3,}`);

    return (
      <Table striped hover>
        <thead>
          <tr><td>Size</td><td>Read sequence ({ motif } tract highlighted)</td></tr>
        </thead>
        <tbody>
          { reads.map((b, index) => {
            return (
                   <tr key={ index }>
                     <td><strong>{ b.h }</strong></td>
                     <td><div style={ seqStyle }>
                       <Highlight search={ regex } matchStyle={ matchStyle }>{ b.seq }</Highlight>
                     </div></td>
                   </tr>
            );
          }) }
        </tbody>
      </Table>
    );
  },

  render() {
    const content = this.props.content;
    if (!content) return null;

    const object = JSON.parse(content);
    if (object.error) {
      return (
        <Alert bsStyle="danger">
            Execution error: { object.error }
        </Alert>
      );
    }
    //console.log(object);

    const calls = object.tredCalls;
    const tred = this.props.tred;
    const tredinfo = Treds[tred];
    const details = calls[`${tred}.details`];

    const fullReads = [];
    const partialReads = [];
    const pairedReads = calls[`${tred}.PEDP`];
    let PEG = calls[`${tred}.PEG`];
    let PET = calls[`${tred}.PET`];
    if (PEG) PEG = PEG.replace(/[()]/g, "");
    if (PET) PET = PET.replace(/[()]/g, "");

    if (details) {
      details.forEach((e) => {
        if (e.tag === 'FULL') {
          fullReads.push(e);
        } else if (e.tag != 'HANG') {
          partialReads.push(e);
        }
      });
    }

    return (
      <div>
        { this.getStatement(calls) }
        <Accordion>
          <Panel header={ `Full spanning - ${fullReads.length} reads` } eventKey='1'>
            { this.formatReads(fullReads, tredinfo.repeat) }
          </Panel>
          <Panel header={`Partial spanning - ${partialReads.length} reads`} eventKey='2'>
            { this.formatReads(partialReads, tredinfo.repeat) }
          </Panel>
          <Panel header={`Spanning read pairs - ${pairedReads} pairs`} eventKey='3'>
            { PEG } => { PET }
          </Panel>
        </Accordion>
      </div>
    );
  },
});

export default TredparseResults;
