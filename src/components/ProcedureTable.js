import React from 'react';

const ProcedureTable = ({ data }) => {
  return (
    <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '1rem', background: '#fff' }}>
      <thead style={{ background: '#eee' }}>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Expiry</th>
          <th>Primary Owner</th>
          <th>Secondary Owner</th>
          <th>Score</th>
          <th>Status</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>
        {data.map(proc => (
          <tr key={proc.id}>
            <td>{proc.id}</td>
            <td>{proc.name}</td>
            <td>{proc.expiry}</td>
            <td>{proc.primary_owner}</td>
            <td>{proc.secondary_owner}</td>
            <td>{proc.score}</td>
            <td>{proc.status}</td>
            <td><a href={proc.file_link} target="_blank" rel="noreferrer">View</a></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProcedureTable;
