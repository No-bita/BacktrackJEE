import pdfplumber
import json
import re
import os

# Function to extract and process text and images from PDF
def process_text_and_images(pdf_path, output_image_dir):
    questions = []
    question_pattern = re.compile(r"Q(\d+)\.(.*)")  # Matches 'Q1.', 'Q2.', etc.
    option_pattern = re.compile(r"\((\d+)\)\s*([^\(]*)")  # Extract options
    answer_pattern = re.compile(r"(\d+)\.\s*\((\d+)\)")  # Matches answers at the end
    
    # Ensure the image output directory exists
    os.makedirs(output_image_dir, exist_ok=True)

    with pdfplumber.open(pdf_path) as pdf:
        question_id = None
        question_text = ""
        current_options = []
        current_question = None
        image_filename = None
        answers_section = False  # Track when the answer key starts

        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            lines = text.split("\n")

            # Detect when the answer key section starts
            if any(keyword in text for keyword in ["ANSWER KEYS", "Answer Key", "1. ("]):
                answers_section = True
                continue  # Move to answer extraction phase

            for line in lines:
                q_match = question_pattern.match(line)
                o_match = option_pattern.findall(line)
                a_match = answer_pattern.match(line)

                if q_match and not answers_section:
                    # Save previous question if it exists
                    if current_question:
                        question_type = "MCQ" if current_options else "Integer"  # ✅ Ensure question type is set
                        questions.append({
                            "question_id": question_id,
                            "question": question_text.strip(),
                            "type": question_type,
                            "options": current_options if question_type == "MCQ" else [],
                            "answer": None,  # Answer will be added later
                            "image": image_filename if image_filename else None
                        })

                    # Start new question
                    question_id = int(q_match.group(1))
                    question_text = q_match.group(2).strip()
                    current_question = len(questions) + 1
                    current_options = []
                    image_filename = None  # Reset image tracking
                    question_type = None  # ✅ Explicitly define to avoid 'NameError'

                elif o_match and not answers_section:
                    for opt in o_match:
                        option_number, option_text = opt
                        current_options.append(f"({option_number}) {option_text.strip()}")

                elif answers_section and a_match:
                    question_index = int(a_match.group(1)) - 1
                    if 0 <= question_index < len(questions):
                        questions[question_index]["answer"] = a_match.group(2)

                elif not answers_section:
                    question_text += " " + line.strip()

        # Add last question
        if current_question:
            question_type = "MCQ" if current_options else "Integer"
            questions.append({
                "question_id": question_id,
                "question": question_text.strip(),
                "type": question_type,
                "options": current_options if question_type == "MCQ" else [],
                "answer": None,  # Answer will be added later
                "image": image_filename if image_filename else None
            })

    return questions

# File paths
pdf_path = "/Users/aaryanshah/Desktop/Tableau/jee-portal/backend/JEE Mains/Apr_04_Shift_2.pdf"
json_output_path = "/Users/aaryanshah/Desktop/Tableau/jee-portal/backend/JEE Mains/Apr_04_Shift_2.json"
output_image_dir = "/Users/aaryanshah/Desktop/Tableau/jee-portal/JEE Mains/images"

# Extracting and processing text and images
structured_data = process_text_and_images(pdf_path, output_image_dir)

# Save as JSON
with open(json_output_path, "w", encoding="utf-8") as json_file:
    json.dump(structured_data, json_file, indent=4, ensure_ascii=False)

print(f"✅ Data successfully extracted and saved to {json_output_path}")
print(f"📷 Images saved in: {output_image_dir}")