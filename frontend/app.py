import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
from streamlit_option_menu import option_menu
import base64

# Page configuration
st.set_page_config(
    page_title="EPCET Library Management System",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Base URL
API_BASE = "http://localhost:5001/api"

# Custom CSS with EPCET branding and better readability
st.markdown("""
<style>
    /* Main styling */
    .main-header {
        font-size: 3rem;
        color: #2E86AB;
        text-align: center;
        margin-bottom: 2rem;
        font-weight: bold;
        font-family: 'Arial', sans-serif;
    }
    .epcet-brand {
        font-size: 2.5rem;
        color: #1a5276;
        text-align: center;
        margin-bottom: 1rem;
        font-weight: bold;
        font-family: 'Arial', sans-serif;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #A23B72;
        margin-bottom: 1rem;
        font-weight: bold;
        font-family: 'Arial', sans-serif;
    }
    .metric-card {
        background-color: #F8F9FA;
        padding: 1rem;
        border-radius: 10px;
        border-left: 4px solid #2E86AB;
        margin-bottom: 1rem;
    }
    .success-message {
        background-color: #D4EDDA;
        color: #155724;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
    }
    .error-message {
        background-color: #F8D7DA;
        color: #721C24;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
    }
    
    /* Sidebar improvements for better readability */
    .sidebar .sidebar-content {
        background: linear-gradient(180deg, #1a5276 0%, #2E86AB 100%);
        color: white;
    }
    
    /* Menu item styling */
    .st-ae {
        background-color: transparent !important;
    }
    
    /* Option menu styling */
    [data-testid="stSidebarNav"] {
        background-color: #1a5276;
    }
    
    /* Text color improvements */
    .stSidebar .stMarkdown {
        color: white !important;
    }
    
    .stSidebar .stMarkdown h1,
    .stSidebar .stMarkdown h2,
    .stSidebar .stMarkdown h3,
    .stSidebar .stMarkdown p {
        color: white !important;
    }
    
    .stSidebar .stButton button {
        color: white !important;
        border-color: white !important;
    }
    
    .stSidebar .stButton button:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
    }
    
    .epcet-blue {
        color: #1a5276;
    }
    .epcet-red {
        color: #c0392b;
    }
    
    /* Custom scrollbar for sidebar */
    .sidebar .sidebar-content::-webkit-scrollbar {
        width: 8px;
    }
    
    .sidebar .sidebar-content::-webkit-scrollbar-track {
        background: #1a5276;
    }
    
    .sidebar .sidebar-content::-webkit-scrollbar-thumb {
        background: #2E86AB;
        border-radius: 4px;
    }
    
    .sidebar .sidebar-content::-webkit-scrollbar-thumb:hover {
        background: #A23B72;
    }
</style>
""", unsafe_allow_html=True)

# Function to load EPCET logo
def load_epcet_logo():
    try:
        with open("epcet-logo.svg", "r") as file:
            logo_svg = file.read()
        return logo_svg
    except FileNotFoundError:
        # Fallback logo if file not found
        return """
        <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" rx="20" fill="#1a5276"/>
            <text x="60" y="65" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial">
                EPCET
            </text>
            <text x="60" y="85" text-anchor="middle" fill="white" font-size="12" font-family="Arial">
                LIBRARY
            </text>
        </svg>
        """

# Load EPCET logo
EPCET_LOGO = load_epcet_logo()

class LibraryAPI:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def _make_request(self, endpoint, method='GET', data=None):
        try:
            url = f"{self.base_url}{endpoint}"
            if method == 'GET':
                response = requests.get(url, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                error_msg = response.json().get('error', 'Unknown error')
                st.error(f"API Error ({response.status_code}): {error_msg}")
                # Log the full response for debugging
                print(f"Full error response: {response.text}")
                return None
        except requests.exceptions.ConnectionError:
            st.error("❌ Cannot connect to the server. Please make sure the backend is running.")
            return None
        except requests.exceptions.Timeout:
            st.error("⏰ Request timeout. The server is taking too long to respond.")
            return None
        except Exception as e:
            st.error(f"Error: {str(e)}")
            print(f"Detailed error: {e}")
            return None
    
    def get_health(self):
        return self._make_request('/health')
    
    # Books
    def get_books(self, page=1, limit=50, search="", category=""):
        params = f"?page={page}&limit={limit}"
        if search:
            params += f"&search={search}"
        if category:
            params += f"&category={category}"
        return self._make_request(f'/books{params}')
    
    def get_book_categories(self):
        return self._make_request('/books/categories')
    
    def add_book(self, book_data):
        return self._make_request('/books', 'POST', book_data)
    
    def update_book(self, book_id, book_data):
        return self._make_request(f'/books/{book_id}', 'PUT', book_data)
    
    def delete_book(self, book_id):
        return self._make_request(f'/books/{book_id}', 'DELETE')
    
    # Users
    def get_users(self, page=1, limit=50, user_type=""):
        params = f"?page={page}&limit={limit}"
        if user_type:
            params += f"&userType={user_type}"
        return self._make_request(f'/users{params}')
    
    def get_user_types(self):
        return self._make_request('/users/types')
    
    def add_user(self, user_data):
        return self._make_request('/users', 'POST', user_data)
    
    # Transactions
    def borrow_book(self, book_id, user_id, days=14):
        return self._make_request('/transactions/borrow', 'POST', {
            'bookId': book_id,
            'userId': user_id,
            'days': days
        })
    
    def return_book(self, transaction_id):
        return self._make_request('/transactions/return', 'POST', {
            'transactionId': transaction_id
        })
    
    def get_transactions(self, page=1, limit=50, status=""):
        params = f"?page={page}&limit={limit}"
        if status:
            params += f"&status={status}"
        return self._make_request(f'/transactions{params}')
    
    def get_overdue_transactions(self):
        return self._make_request('/transactions/overdue')
    
    # Analytics
    def get_dashboard_stats(self):
        return self._make_request('/analytics/dashboard')
    
    def get_most_borrowed(self, limit=10, period="all"):
        return self._make_request(f'/analytics/most-borrowed?limit={limit}&period={period}')
    
    def get_user_categories(self):
        return self._make_request('/analytics/user-categories')
    
    def get_reading_patterns(self):
        return self._make_request('/analytics/reading-patterns')
    
    def get_monthly_report(self, year=datetime.now().year):
        return self._make_request(f'/analytics/monthly-report?year={year}')

# Initialize API
api = LibraryAPI(API_BASE)

def check_connection():
    """Check if backend is connected"""
    health = api.get_health()
    if health and health.get('status') == 'OK':
        return True
    return False

def main_page():
    """Main Dashboard"""
    st.markdown('<div class="epcet-brand">🏛️ EPCET LIBRARY MANAGEMENT SYSTEM</div>', unsafe_allow_html=True)
    
    if not check_connection():
        st.error("🔌 Backend server is not connected. Please make sure the server is running on localhost:5001")
        return
    
    # Dashboard Stats
    st.markdown('<div class="sub-header">📊 Dashboard Overview</div>', unsafe_allow_html=True)
    
    stats = api.get_dashboard_stats()
    if stats and stats.get('success'):
        data = stats['data']['overview']
        
        col1, col2, col3, col4, col5, col6 = st.columns(6)
        
        with col1:
            st.metric("Total Books", data['totalBooks'])
        with col2:
            st.metric("Available Books", data['availableBooks'])
        with col3:
            st.metric("Total Users", data['totalUsers'])
        with col4:
            st.metric("Active Borrows", data['activeBorrows'])
        with col5:
            st.metric("Total Transactions", data['totalTransactions'])
        with col6:
            st.metric("Overdue Books", data['overdueBooks'])
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            # Popular Categories
            categories_data = stats['data']['popularCategories']
            if categories_data:
                df_categories = pd.DataFrame(categories_data)
                fig_categories = px.pie(df_categories, values='count', names='_id', 
                                      title='📚 Popular Book Categories')
                st.plotly_chart(fig_categories, use_container_width=True)
        
        with col2:
            # User Type Stats
            user_stats = stats['data']['userTypeStats']
            if user_stats:
                df_users = pd.DataFrame(user_stats)
                fig_users = px.bar(df_users, x='_id', y='count', 
                                 title='👥 Borrowing by User Type',
                                 color='_id')
                st.plotly_chart(fig_users, use_container_width=True)
        
        # Recent Activity
        st.markdown('<div class="sub-header">🔄 Recent Activity</div>', unsafe_allow_html=True)
        
        transactions = api.get_transactions(limit=10)
        if transactions and transactions.get('success'):
            df_transactions = pd.DataFrame(transactions['data'])
            if not df_transactions.empty:
                # Simplify the dataframe for display
                display_df = df_transactions[['transactionId', 'status', 'borrowDate']].copy()
                if 'bookId' in df_transactions.columns and isinstance(df_transactions['bookId'].iloc[0], dict):
                    display_df['Book'] = df_transactions['bookId'].apply(lambda x: x.get('title', 'N/A'))
                if 'userId' in df_transactions.columns and isinstance(df_transactions['userId'].iloc[0], dict):
                    display_df['User'] = df_transactions['userId'].apply(lambda x: x.get('name', 'N/A'))
                
                st.dataframe(display_df, use_container_width=True)

def books_management():
    """Books Management Page"""
    st.markdown('<div class="sub-header">📖 Books Management</div>', unsafe_allow_html=True)
    
    tab1, tab2, tab3, tab4 = st.tabs(["View Books", "Add New Book", "Search Books", "Update/Delete Books"])
    
    with tab1:
        st.subheader("All Books")
        books = api.get_books(limit=100)
        if books and books.get('success'):
            df_books = pd.DataFrame(books['data'])
            if not df_books.empty:
                st.dataframe(df_books, use_container_width=True)
    
    with tab2:
        st.subheader("Add New Book")
        
        with st.form("add_book_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                title = st.text_input("Title*")
                author = st.text_input("Author*")
                category = st.text_input("Category*")
                isbn = st.text_input("ISBN")
            
            with col2:
                total_copies = st.number_input("Total Copies*", min_value=1, value=1)
                published_year = st.number_input("Published Year", min_value=1000, max_value=datetime.now().year)
                description = st.text_area("Description")
            
            submitted = st.form_submit_button("Add Book")
            
            if submitted:
                if title and author and category:
                    book_data = {
                        'title': title,
                        'author': author,
                        'category': category,
                        'isbn': isbn if isbn else None,
                        'totalCopies': total_copies,
                        'availableCopies': total_copies,
                        'publishedYear': published_year if published_year else None,
                        'description': description if description else None
                    }
                    
                    result = api.add_book(book_data)
                    if result and result.get('success'):
                        st.markdown('<div class="success-message">✅ Book added successfully!</div>', unsafe_allow_html=True)
                        time.sleep(2)
                        st.rerun()
                else:
                    st.error("Please fill in all required fields (*)")
    
    with tab3:
        st.subheader("Search Books")
        
        col1, col2 = st.columns([3, 1])
        with col1:
            search_query = st.text_input("Search by title, author, or category")
        with col2:
            categories_response = api.get_book_categories()
            category_options = [""] + (categories_response['data'] if categories_response and categories_response.get('success') else [])
            category_filter = st.selectbox("Category", category_options)
        
        if search_query or category_filter:
            books = api.get_books(search=search_query, category=category_filter, limit=100)
            if books and books.get('success'):
                df_books = pd.DataFrame(books['data'])
                if not df_books.empty:
                    st.dataframe(df_books, use_container_width=True)
                else:
                    st.info("No books found matching your search criteria.")
    
    with tab4:
        st.subheader("Update or Delete Books")
        
        books = api.get_books(limit=100)
        if books and books.get('success'):
            df_books = pd.DataFrame(books['data'])
            if not df_books.empty:
                # Book selection
                book_options = df_books['title'] + " by " + df_books['author']
                selected_book = st.selectbox("Select Book to Edit", book_options)
                
                if selected_book:
                    book_index = df_books[book_options == selected_book].index[0]
                    book_data = df_books.iloc[book_index]
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.write("**Current Details:**")
                        st.write(f"Title: {book_data['title']}")
                        st.write(f"Author: {book_data['author']}")
                        st.write(f"Category: {book_data['category']}")
                        st.write(f"Available: {book_data['availableCopies']}/{book_data['totalCopies']}")
                    
                    with col2:
                        st.write("**Update Book:**")
                        with st.form("update_book_form"):
                            new_total = st.number_input("Total Copies", min_value=1, value=int(book_data['totalCopies']))
                            new_available = st.number_input("Available Copies", min_value=0, max_value=new_total, 
                                                          value=int(book_data['availableCopies']))
                            update_submitted = st.form_submit_button("Update Book")
                            
                            if update_submitted:
                                update_data = {
                                    'totalCopies': new_total,
                                    'availableCopies': new_available
                                }
                                result = api.update_book(book_data['_id'], update_data)
                                if result and result.get('success'):
                                    st.markdown('<div class="success-message">✅ Book updated successfully!</div>', unsafe_allow_html=True)
                                    time.sleep(2)
                                    st.rerun()
                    
                    # Delete option
                    if st.button("❌ Delete Book", type="secondary"):
                        if st.warning("Are you sure you want to delete this book?"):
                            result = api.delete_book(book_data['_id'])
                            if result and result.get('success'):
                                st.markdown('<div class="success-message">✅ Book deleted successfully!</div>', unsafe_allow_html=True)
                                time.sleep(2)
                                st.rerun()

def users_management():
    """Users Management Page"""
    st.markdown('<div class="sub-header">👥 Users Management</div>', unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["View Users", "Add New User"])
    
    with tab1:
        st.subheader("All Users")
        users = api.get_users(limit=100)
        if users and users.get('success'):
            df_users = pd.DataFrame(users['data'])
            if not df_users.empty:
                st.dataframe(df_users, use_container_width=True)
    
    with tab2:
        st.subheader("Add New User")
        
        with st.form("add_user_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                name = st.text_input("Full Name*")
                email = st.text_input("Email*")
                user_type = st.selectbox("User Type*", ["student", "faculty", "staff", "public"])
            
            with col2:
                department = st.text_input("Department")
            
            submitted = st.form_submit_button("Add User")
            
            if submitted:
                if name and email and user_type:
                    user_data = {
                        'name': name,
                        'email': email,
                        'userType': user_type,
                        'department': department if department else None
                    }
                    
                    result = api.add_user(user_data)
                    if result and result.get('success'):
                        st.markdown('<div class="success-message">✅ User added successfully!</div>', unsafe_allow_html=True)
                        time.sleep(2)
                        st.rerun()
                else:
                    st.error("Please fill in all required fields (*)")

def transactions_management():
    """Transactions Management Page"""
    st.markdown('<div class="sub-header">🔄 Transactions Management</div>', unsafe_allow_html=True)
    
    tab1, tab2, tab3, tab4 = st.tabs(["Borrow Book", "Return Book", "View Transactions", "Overdue Books"])
    
    with tab1:
        st.subheader("Borrow a Book")
        
        # Get available books and users
        books = api.get_books(limit=100)
        users = api.get_users(limit=100)
        
        if books and books.get('success') and users and users.get('success'):
            df_books = pd.DataFrame(books['data'])
            df_users = pd.DataFrame(users['data'])
            
            # Filter available books
            available_books = df_books[df_books['availableCopies'] > 0]
            
            if not available_books.empty and not df_users.empty:
                with st.form("borrow_book_form"):
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        book_options = available_books['title'] + " by " + available_books['author']
                        selected_book = st.selectbox("Select Book*", book_options)
                        if selected_book:
                            book_id = available_books[book_options == selected_book]['_id'].iloc[0]
                            st.info(f"Available copies: {available_books[book_options == selected_book]['availableCopies'].iloc[0]}")
                    
                    with col2:
                        user_options = df_users['name'] + " (" + df_users['userType'] + ")"
                        selected_user = st.selectbox("Select User*", user_options)
                        if selected_user:
                            user_id = df_users[user_options == selected_user]['_id'].iloc[0]
                        borrow_days = st.number_input("Borrow Duration (days)", min_value=1, max_value=30, value=14)
                    
                    submitted = st.form_submit_button("Borrow Book")
                    
                    if submitted:
                        if not selected_book or not selected_user:
                            st.error("Please select both a book and a user")
                        else:
                            with st.spinner("Processing borrow request..."):
                                result = api.borrow_book(book_id, user_id, borrow_days)
                                if result and result.get('success'):
                                    st.markdown('<div class="success-message">✅ Book borrowed successfully!</div>', unsafe_allow_html=True)
                                    st.json(result['data'])  # Show transaction details
                                    time.sleep(3)
                                    st.rerun()
            else:
                if available_books.empty:
                    st.warning("No available books found. All books are currently borrowed.")
                if df_users.empty:
                    st.warning("No active users found.")
    
    with tab2:
        st.subheader("Return a Book")
        
        # Get borrowed transactions
        transactions = api.get_transactions(status="borrowed", limit=100)
        if transactions and transactions.get('success'):
            df_transactions = pd.DataFrame(transactions['data'])
            if not df_transactions.empty:
                with st.form("return_book_form"):
                    transaction_options = []
                    for _, row in df_transactions.iterrows():
                        book_title = row['bookId']['title'] if isinstance(row['bookId'], dict) else 'Unknown'
                        user_name = row['userId']['name'] if isinstance(row['userId'], dict) else 'Unknown'
                        due_date = row.get('dueDate', '')
                        transaction_options.append(f"{row['transactionId']} - {book_title} (User: {user_name}, Due: {due_date})")
                    
                    selected_transaction = st.selectbox("Select Transaction to Return*", transaction_options)
                    transaction_id = selected_transaction.split(" - ")[0] if selected_transaction else ""
                    
                    submitted = st.form_submit_button("Return Book")
                    
                    if submitted:
                        if not transaction_id:
                            st.error("Please select a transaction to return")
                        else:
                            with st.spinner("Processing return..."):
                                result = api.return_book(transaction_id)
                                if result and result.get('success'):
                                    st.markdown('<div class="success-message">✅ Book returned successfully!</div>', unsafe_allow_html=True)
                                    if result.get('fine'):
                                        st.warning(result['fine'])
                                    time.sleep(3)
                                    st.rerun()
            else:
                st.success("🎉 No borrowed books found - all books are returned!")
    
    with tab3:
        st.subheader("All Transactions")
        
        status_filter = st.selectbox("Filter by Status", ["", "borrowed", "returned", "overdue"])
        transactions = api.get_transactions(status=status_filter if status_filter else "", limit=100)
        
        if transactions and transactions.get('success'):
            df_transactions = pd.DataFrame(transactions['data'])
            if not df_transactions.empty:
                # Simplify display
                display_data = []
                for _, row in df_transactions.iterrows():
                    display_data.append({
                        'Transaction ID': row['transactionId'],
                        'Book': row['bookId']['title'] if isinstance(row['bookId'], dict) else 'Unknown',
                        'User': row['userId']['name'] if isinstance(row['userId'], dict) else 'Unknown',
                        'Status': row['status'],
                        'Borrow Date': row['borrowDate'],
                        'Due Date': row.get('dueDate', ''),
                        'Return Date': row.get('returnDate', '')
                    })
                
                st.dataframe(pd.DataFrame(display_data), use_container_width=True)
    
    with tab4:
        st.subheader("Overdue Books")
        
        overdue = api.get_overdue_transactions()
        if overdue and overdue.get('success'):
            df_overdue = pd.DataFrame(overdue['data'])
            if not df_overdue.empty:
                st.warning(f"🚨 There are {len(df_overdue)} overdue books!")
                
                display_data = []
                for _, row in df_overdue.iterrows():
                    display_data.append({
                        'Transaction ID': row['transactionId'],
                        'Book': row['bookId']['title'] if isinstance(row['bookId'], dict) else 'Unknown',
                        'User': row['userId']['name'] if isinstance(row['userId'], dict) else 'Unknown',
                        'Due Date': row.get('dueDate', ''),
                        'Overdue Days': row.get('overdueDays', 'N/A')
                    })
                
                st.dataframe(pd.DataFrame(display_data), use_container_width=True)
            else:
                st.success("🎉 No overdue books!")

def analytics_dashboard():
    """Analytics Dashboard"""
    st.markdown('<div class="sub-header">📈 Analytics Dashboard</div>', unsafe_allow_html=True)
    
    tab1, tab2, tab3, tab4 = st.tabs(["Most Borrowed", "User Analysis", "Reading Patterns", "Monthly Report"])
    
    with tab1:
        st.subheader("Most Borrowed Books")
        
        col1, col2 = st.columns(2)
        with col1:
            limit = st.number_input("Number of books", min_value=5, max_value=50, value=10)
        with col2:
            period = st.selectbox("Time Period", ["all", "week", "month", "year"])
        
        most_borrowed = api.get_most_borrowed(limit=limit, period=period)
        if most_borrowed and most_borrowed.get('success'):
            df_most_borrowed = pd.DataFrame(most_borrowed['data'])
            if not df_most_borrowed.empty:
                # Check what columns are available and use appropriate ones
                if 'borrowCount' in df_most_borrowed.columns:
                    y_column = 'borrowCount'
                elif 'count' in df_most_borrowed.columns:
                    y_column = 'count'
                else:
                    # If neither exists, use the first numeric column
                    numeric_columns = df_most_borrowed.select_dtypes(include=['number']).columns
                    y_column = numeric_columns[0] if len(numeric_columns) > 0 else df_most_borrowed.columns[1]
                
                # Bar chart
                fig = px.bar(df_most_borrowed, x='title', y=y_column, 
                           title=f'📊 Most Borrowed Books ({period.capitalize()})',
                           labels={'title': 'Book Title', y_column: 'Borrow Count'})
                fig.update_layout(xaxis_tickangle=-45)
                st.plotly_chart(fig, use_container_width=True)
                
                # Data table
                st.dataframe(df_most_borrowed, use_container_width=True)
    
    with tab2:
        st.subheader("User Category Analysis")
        
        user_analysis = api.get_user_categories()
        if user_analysis and user_analysis.get('success'):
            df_user_analysis = pd.DataFrame(user_analysis['data'])
            if not df_user_analysis.empty:
                # Rename _id to userType for clarity
                df_user_analysis = df_user_analysis.rename(columns={'_id': 'userType'})
                
                col1, col2 = st.columns(2)
                
                with col1:
                    # Pie chart - use available columns
                    value_column = 'totalBorrows' if 'totalBorrows' in df_user_analysis.columns else 'count'
                    fig_pie = px.pie(df_user_analysis, values=value_column, names='userType',
                                   title='📊 Borrowing Distribution by User Type')
                    st.plotly_chart(fig_pie, use_container_width=True)
                
                with col2:
                    # Bar chart
                    fig_bar = px.bar(df_user_analysis, x='userType', y=value_column,
                                   title='📈 Total Borrows by User Type',
                                   color='userType')
                    st.plotly_chart(fig_bar, use_container_width=True)
    
    with tab3:
        st.subheader("Reading Patterns")
        
        reading_patterns = api.get_reading_patterns()
        if reading_patterns and reading_patterns.get('success'):
            df_patterns = pd.DataFrame(reading_patterns['data'])
            if not df_patterns.empty:
                # Add month names
                month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                df_patterns['Month'] = df_patterns['_id'].apply(lambda x: month_names[x-1] if 1 <= x <= 12 else f'Month {x}')
                
                col1, col2 = st.columns(2)
                
                with col1:
                    # Use available columns for transactions
                    transactions_column = 'totalTransactions' if 'totalTransactions' in df_patterns.columns else 'count'
                    fig_transactions = px.bar(df_patterns, x='Month', y=transactions_column,
                                            title='📅 Monthly Borrowing Activity')
                    st.plotly_chart(fig_transactions, use_container_width=True)
                
                with col2:
                    # Use available columns for duration
                    duration_column = 'averageBorrowDuration' if 'averageBorrowDuration' in df_patterns.columns else 'avgDuration'
                    if duration_column in df_patterns.columns:
                        fig_duration = px.line(df_patterns, x='Month', y=duration_column,
                                             title='⏱️ Average Borrow Duration (Days)')
                        st.plotly_chart(fig_duration, use_container_width=True)
    
    with tab4:
        st.subheader("Monthly Report")
        
        current_year = datetime.now().year
        selected_year = st.selectbox("Select Year", 
                                   range(current_year-2, current_year+1), 
                                   index=2)
        
        monthly_report = api.get_monthly_report(year=selected_year)
        if monthly_report and monthly_report.get('success'):
            df_report = pd.DataFrame(monthly_report['data'])
            if not df_report.empty:
                # Add month names
                month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December']
                df_report['Month'] = df_report['month'].apply(lambda x: month_names[x-1])
                
                # Create comprehensive chart - use available columns
                fig = go.Figure()
                
                # Check which columns are available and add traces accordingly
                if 'totalBorrows' in df_report.columns:
                    fig.add_trace(go.Scatter(x=df_report['Month'], y=df_report['totalBorrows'],
                                           mode='lines+markers', name='Total Borrows',
                                           line=dict(color='blue', width=3)))
                
                if 'totalReturns' in df_report.columns:
                    fig.add_trace(go.Scatter(x=df_report['Month'], y=df_report['totalReturns'],
                                           mode='lines+markers', name='Total Returns',
                                           line=dict(color='green', width=3)))
                
                if 'totalOverdue' in df_report.columns:
                    fig.add_trace(go.Bar(x=df_report['Month'], y=df_report['totalOverdue'],
                                       name='Overdue Books', marker_color='red'))
                
                fig.update_layout(title=f'📈 Monthly Library Activity - {selected_year}',
                                xaxis_title='Month',
                                yaxis_title='Count')
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Display metrics using available columns
                col1, col2, col3 = st.columns(3)
                with col1:
                    total_borrows = df_report['totalBorrows'].sum() if 'totalBorrows' in df_report.columns else 0
                    st.metric("Total Borrows", total_borrows)
                with col2:
                    total_returns = df_report['totalReturns'].sum() if 'totalReturns' in df_report.columns else 0
                    st.metric("Total Returns", total_returns)
                with col3:
                    total_overdue = df_report['totalOverdue'].sum() if 'totalOverdue' in df_report.columns else 0
                    st.metric("Total Overdue", total_overdue)
                
                # Detailed table
                st.dataframe(df_report, use_container_width=True)

def main():
    """Main application with navigation"""
    
    # Sidebar navigation
    with st.sidebar:
        # EPCET Logo and Branding with better styling
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem 0; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 1rem;">
            {EPCET_LOGO}
            <h2 style="color: white; margin: 0.5rem 0 0 0; font-size: 1.2rem;">EPCET Library</h2>
            <p style="color: #d0d0d0; font-size: 0.9rem; margin: 0;">Management System</p>
        </div>
            
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # Improved navigation menu with better contrast
        selected = option_menu(
            menu_title="MAIN NAVIGATION",
            options=["Dashboard", "Books", "Users", "Transactions", "Analytics"],
            icons=["house-fill", "book-fill", "people-fill", "arrow-left-right", "graph-up"],
            menu_icon="cast",
            default_index=0,
            styles={
                "container": {"padding": "5px", "background-color": "transparent"},
                "icon": {"color": "white", "font-size": "16px"}, 
                "nav-link": {
                    "font-size": "15px",
                    "text-align": "left",
                    "margin": "3px",
                    "color": "white",
                    "border-radius": "8px",
                    "padding": "10px 15px"
                },
                "nav-link-selected": {
                    "background-color": "rgba(255, 255, 255, 0.2)",
                    "color": "white",
                    "font-weight": "bold",
                    "border": "1px solid rgba(255, 255, 255, 0.3)"
                },
                "menu-title": {
                    "color": "white",
                    "font-weight": "bold",
                    "font-size": "16px"
                }
            }
        )
        
        st.markdown("---")
        
        # System Status with better styling
        st.markdown("### 🔄 System Status")
        status_container = st.container()
        with status_container:
            if check_connection():
                st.success("✅ **Backend Connected**", icon="🔗")
                health = api.get_health()
                if health:
                    db_status = health['database']['status']
                    db_connected = health['database']['connected']
                    if db_connected:
                        st.markdown(f"<span style='color: #90EE90;'>● Database: {db_status}</span>", unsafe_allow_html=True)
                    else:
                        st.markdown(f"<span style='color: #FF6B6B;'>● Database: {db_status}</span>", unsafe_allow_html=True)
            else:
                st.error("❌ **Backend Disconnected**", icon="🚫")
        
        st.markdown("---")
        
        # Quick Actions with better styling
        st.markdown("### ⚡ Quick Actions")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Refresh", use_container_width=True, help="Refresh the page"):
                st.rerun()
        with col2:
            if st.button("📊 Health", use_container_width=True, help="Check system health"):
                health = api.get_health()
                if health:
                    st.success(f"Status: {health['status']}")
        
        st.markdown("---")
        
        # Footer with better styling
        st.markdown("""
        <div style="text-align: center; color: #e0e0e0; font-size: 0.8rem; padding: 1rem 0;">
            <p><strong>EPCET Library Management System</strong></p>
            <p>Version 2.0</p>
            <p style="font-size: 0.7rem; color: #b0b0b0;">© 2024 All Rights Reserved</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Page routing
    if selected == "Dashboard":
        main_page()
    elif selected == "Books":
        books_management()
    elif selected == "Users":
        users_management()
    elif selected == "Transactions":
        transactions_management()
    elif selected == "Analytics":
        analytics_dashboard()

if __name__ == "__main__":
    main()