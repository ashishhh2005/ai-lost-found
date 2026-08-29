
import { useState } from "react";
import "./ReportLost.css";

const API_URL = "https://ai-lost-found-backend.onrender.com";

function ReportLost({ onSubmitted }) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setMessage("Submitting...");

    try {
      const response = await fetch(`${API_URL}/report-lost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_name: itemName,
          description: description,
          location: location,
          date: date,
          time: time,
        }),
      });

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Backend returned invalid response: ${responseText}`
        );
      }

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.message ||
            `Server error: ${response.status}`
        );
        return;
      }

      const id =
        data?.item?.id ??
        data?.id ??
        data?.lost_item_id;

      if (!id) {
        console.error("Unexpected backend response:", data);

        setMessage(
          "Item was submitted, but the backend did not return an item ID."
        );
        return;
      }

      setMessage(
        `Lost item reported successfully! ID: ${id}`
      );

      setItemName("");
      setDescription("");
      setLocation("");
      setDate("");
      setTime("");

      if (onSubmitted) {
        onSubmitted(id);
      }
    } catch (error) {
      console.error("Report Lost Error:", error);

      setMessage(
        error?.message ||
          "Cannot connect to the backend."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-container">

        <h1>Report Lost Item</h1>

        <p>
          Enter the details of the item you lost.
        </p>

        <form onSubmit={handleSubmit}>

          <label>Item Name</label>

          <input
            type="text"
            placeholder="Example: Black Wallet"
            value={itemName}
            onChange={(e) =>
              setItemName(e.target.value)
            }
            required
            disabled={submitting}
          />

          <label>Description</label>

          <textarea
            placeholder="Describe the item..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            required
            disabled={submitting}
          />

          <label>Location</label>

          <input
            type="text"
            placeholder="Example: College Library"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            required
            disabled={submitting}
          />

          <label>Date</label>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            required
            disabled={submitting}
          />

          <label>Time</label>

          <input
            type="time"
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
            required
            disabled={submitting}
          />

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit Lost Item"}
          </button>

        </form>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

export default ReportLost;
