import React, { useState } from 'react';

const SubmitProcedure = () => {
  const [formData, setFormData] = useState({
    name: '', expiry: '', primary_owner: '', secondary_owner: '', lob: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => payload.append(key, val));
    payload.append('file', file);

    const res = await fetch('/ProceduresHubEG6/api/procedures', {
      method: 'POST',
      body: payload
    });

    const data = await res.json();
    if (res.ok) setMessage('Procedure submitted successfully!');
    else setMessage(data.message || 'Failed to submit');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Submit New Procedure</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="name" placeholder="Procedure Name" onChange={handleChange} required /><br/>
        <input type="date" name="expiry" onChange={handleChange} required /><br/>
        <input name="primary_owner" placeholder="Primary Owner" onChange={handleChange} required /><br/>
        <input name="secondary_owner" placeholder="Secondary Owner" onChange={handleChange} required /><br/>
        <select name="lob" onChange={handleChange} required>
          <option value="">Select LOB</option>
          <option value="IWPB">IWPB</option>
          <option value="CIB">CIB</option>
          <option value="GCOO">GCOO</option>
        </select><br/>
        <input type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx" required /><br/>
        <button type="submit">Submit</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default SubmitProcedure;
