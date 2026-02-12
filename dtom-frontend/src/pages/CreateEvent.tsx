import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { events } from '../api';
import Navbar from '../components/Navbar';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [hasFundraising, setHasFundraising] = useState(false);
  const [fundraisingGoal, setFundraisingGoal] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ev = await events.create({
        title,
        description,
        purpose: purpose || undefined,
        location: location || undefined,
        eventDate: eventDate || undefined,
        hasFundraising,
        fundraisingGoal: hasFundraising && fundraisingGoal ? parseFloat(fundraisingGoal) : undefined,
      });
      if (imageFile) {
        await events.uploadImage(ev.id, imageFile);
      }
      navigate(`/events/${ev.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
    <Navbar />
    <div className="page-narrow">
      <h1>Create Event</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
        <input placeholder="Purpose (optional)" value={purpose} onChange={e => setPurpose(e.target.value)} />
        <input placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} />
        <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        <label className="file-label">
          Event Image (optional)
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}

        <div className="fundraising-toggle">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#d4a520' }}>
            <input
              type="checkbox"
              checked={hasFundraising}
              onChange={e => setHasFundraising(e.target.checked)}
              style={{ width: 'auto', accentColor: '#d4a520' }}
            />
            Enable Fundraising
          </label>
          {hasFundraising && (
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Fundraising goal ($) — optional"
              value={fundraisingGoal}
              onChange={e => setFundraisingGoal(e.target.value)}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <button type="submit">Create</button>
      </form>
    </div>
    </>
  );
}
