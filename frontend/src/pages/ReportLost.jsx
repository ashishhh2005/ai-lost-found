import { useState } from "react";
import "./ReportLost.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-lost-found-bamz.onrender.com";

function ReportLost({ onSubmitted }) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("Submitting...");

    try {
      const response = await fetch(
        `${API_URL}/report-lost`,
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.message ||
            "Something went wrong."
        );
        return;
      }

      const id = data?.item?.id;

      if (!id) {
        setMessage(
          "Lost item was submitted, but no item ID was returned."
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
        "Cannot connect to the backend."
      );
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
          />

          <label>Description</label>

          <textarea
            placeholder="Describe the item..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            required
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
          />

          <label>Date</label>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            required
          />

          <label>Time</label>

          <input
            type="time"
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
            required
          />

          <button type="submit">
            Submit Lost Item
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