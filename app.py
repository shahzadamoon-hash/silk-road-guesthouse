from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import datetime
from flask_mail import Mail, Message

app = Flask(__name__)
CORS(app) # Allows your HTML site to talk to this Python server

# Email Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Mail Provider
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = '23f2002668@ds.study.iitm.ac.in'
app.config['MAIL_PASSWORD'] = 'pduf htsk jgri hnxb'                # Gmail App Password
app.config['MAIL_DEFAULT_SENDER'] = '23f2002668@ds.study.iitm.ac.in'
mail = Mail(app)
owner_email = '23f2002668@ds.study.iitm.ac.in'

# Define the scope required to view and manage Google Drive / Sheets files
scope = [
    "https://googleapis.com",
    "https://googleapis.com"
]

# Load credentials and open the master workbook
creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
client = gspread.authorize(creds)

SPREADSHEET_NAME = "Silk Road Guesthouse DataBase"
db_workbook = client.open(SPREADSHEET_NAME)

# Connect to individual sheets
guests_sheet = db_workbook.worksheet("Guests Details")
rooms_sheet = db_workbook.worksheet("Rooms Details")
reviews_sheet = db_workbook.worksheet("Reviews")
images_sheet = db_workbook.worksheet("Hotel Images")


def send_email(name, mobile, email, room, checkin, checkout, guests, message):
    msg = Message("Regarding Room Booking",
                  sender=owner_email,
                  recipients=[owner_email])
    msg.html = f"""
    <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 20px; color: #333333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
                
                <h2 style="color: #4a674f; margin-top: 0; border-bottom: 2px solid #f0f2f5; padding-bottom: 15px;">
                    🏨 New Room Booking Registration
                </h2>
                
                <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                    Hello!<br><br>
                    Someone has registered for a room booking at your guesthouse. Please review the customer details below and take necessary action.
                </p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #4a674f; padding: 20px; border-radius: 4px; margin: 25px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666; width: 40%;">👤 Name:</td>
                            <td style="padding: 6px 0; color: #111111;">{name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666;">📱 Mobile No.:</td>
                            <td style="padding: 6px 0; color: #111111;">{mobile}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666;">✉️ Email ID:</td>
                            <td style="padding: 6px 0; color: #111111;"><a href="mailto:{email}" style="color: #4a674f; text-decoration: none;">{email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666;">🛌 Room Preference:</td>
                            <td style="padding: 6px 0; color: #111111; font-weight: 600;">{room}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666;">📅 Check-In:</td>
                            <td style="padding: 6px 0; color: #111111;">{checkin}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666;">📅 Check-Out:</td>
                            <td style="padding: 6px 0; color: #111111;">{checkout}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #666666;">👥 Total Guests:</td>
                            <td style="padding: 6px 0; color: #111111;">{guests}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0 6px 0; font-weight: bold; color: #666666; vertical-align: top;">💬 Special Message:</td>
                            <td style="padding: 12px 0 6px 0; color: #444444; font-style: italic; line-height: 1.4;">"{message}"</td>
                        </tr>
                    </table>
                </div>
                
                <p style="font-size: 12px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #f0f2f5; padding-top: 15px;">
                    This is an automated notification from your Silk Road Guesthouse website system.
                </p>
            </div>
        </body>
    </html>
    """
    mail.send(msg)
    print("Mail sent successfully!")
    return "Mail Sent Successfully!"


@app.route('/api/book', methods=['POST'])
def book_room():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "Missing payload"}), 400
            
        row = [
            data.get('name', ''),
            data.get('mobile', ''),
            data.get('email', ''),
            data.get('room', ''),
            data.get('checkin', ''),
            data.get('checkout', ''),
            data.get('guests', ''),
            data.get('message', ''),
            "Pending" 
        ]
        
        guests_sheet.append_row(row)
        
        # Safe format transformations for email strings
        client_name = str(row[0])
        client_phone = str(row[1]).strip()
        client_mail = str(row[2]).strip().lower()
        
        send_email(client_name, client_phone, client_mail, row[3], row[4], row[5], row[6], row[7])
        return jsonify({"success": True, "message": "Booking received!"}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# --- NEW EXPOSED DB ENDPOINTS FOR YOUR FRONTEND ---

@app.route('/api/rooms', methods=['GET'])
def get_all_rooms():
    try:
        records = rooms_sheet.get_all_records()
        return jsonify({"success": True, "rooms": records}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/reviews', methods=['GET', 'POST'])
def handle_reviews():
    if request.method == 'POST':
        try:
            data = request.json
            today_date = datetime.date.today().strftime("%Y-%m-%d")
            
            row = [
                data.get('name', ''),
                data.get('country', ''),
                data.get('review', ''),
                today_date,
                "Pending"  # Requires approval from owner inside google sheets
            ]
            reviews_sheet.append_row(row)
            return jsonify({"success": True, "message": "Review submitted for approval!"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
            
    else:  # GET Method
        try:
            all_reviews = reviews_sheet.get_all_records()
            # Filters records matching case-insensitive 'approved' value matches
            approved = [r for r in all_reviews if str(r.get('status', r.get('Status', ''))).strip().lower() == 'approved']
            return jsonify({"success": True, "reviews": approved}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/gallery', methods=['GET'])
def get_gallery_images():
    try:
        records = images_sheet.get_all_records()
        return jsonify({"success": True, "images": records}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
