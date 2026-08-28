import { useState } from "react";
import "./ReportFound.css";

function ReportFound() {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState("");

  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("Submitting...");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/report-found",
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
            contact: contact,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {

        // =========================================
        // DUPLICATE FOUND ITEM
        // =========================================

        if (data.duplicate === true) {
          setMessage(
            `This found item has already been reported. ID: ${data.item.id}`
          );

          return;
        }

        // =========================================
        // NEW FOUND ITEM
        // =========================================

        setMessage(
          `Found item reported successfully! ID: ${data.item.id}`
        );

        // Clear form only for a new submission
        setItemName("");
        setDescription("");
        setLocation("");
        setDate("");
        setTime("");
        setContact("");

      } else {

        setMessage(
          data.detail ||
          data.message ||
          "Something went wrong."
        );
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Cannot connect to the backend."
      );
    }
  };

  return (
    <div className="report-page">

      <div className="report-container">

        <h1>Report Found Item</h1>

        <p>
          Enter the details of the item you found.
        </p>

        <form onSubmit={handleSubmit}>

          {/* ITEM NAME */}

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


          {/* DESCRIPTION */}

          <label>Description</label>

          <textarea
            placeholder="Describe the item..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            required
          />


          {/* LOCATION */}

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


          {/* DATE */}

          <label>Date</label>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            required
          />


          {/* TIME */}

          <label>Time</label>

          <input
            type="time"
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
            required
          />


          {/* CONTACT */}

          <label>Contact Information</label>

          <input
            type="text"
            placeholder="Example: 9876543210 or email@example.com"
            value={contact}
            onChange={(e) =>
              setContact(e.target.value)
            }
            required
          />

          <small className="contact-help">
            Provide a phone number or email so the owner
            can contact you.
          </small>


          {/* SUBMIT */}

          <button type="submit">
            Submit Found Item
          </button>

        </form>


        {/* MESSAGE */}

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default ReportFound;