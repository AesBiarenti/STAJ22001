from flask import Blueprint, request, jsonify
from services.qdrant_service import qdrant_service
from models.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
import logging

logger = logging.getLogger(__name__)

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/employees', methods=['GET'])
def get_all_employees():
    """Tüm çalışanları getir"""
    try:
        employees = qdrant_service.list_employees()
        
        return jsonify({
            "data": employees,
            "success": True,
            "count": len(employees)
        }), 200
        
    except Exception as e:
        logger.error(f"Employees GET Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@employee_bp.route('/employees', methods=['POST'])
def add_employee():
    """Çalışan ekle"""
    try:
        data = request.get_json()
        employee_request = EmployeeCreate(**data)
        
        employee = qdrant_service.add_employee(employee_request.dict())
        
        return jsonify({"success": True, "message": "Çalışan eklendi"}), 201
        
    except Exception as e:
        logger.error(f"Employees POST Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 400

@employee_bp.route('/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    """Çalışan güncelle"""
    try:
        data = request.get_json()
        employee_request = EmployeeUpdate(**data)
        
        # Sadece None olmayan alanları güncelle
        update_data = {k: v for k, v in employee_request.dict().items() if v is not None}
        
        employee = qdrant_service.update_employee(employee_id, update_data)
        
        return jsonify({
            "data": employee,
            "success": True,
            "message": "Çalışan başarıyla güncellendi"
        }), 200
        
    except Exception as e:
        logger.error(f"Employees PUT Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@employee_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Çalışan sil"""
    try:
        qdrant_service.delete_employee(employee_id)
        
        return jsonify({
            "success": True,
            "message": "Çalışan başarıyla silindi",
            "deletedId": employee_id
        }), 200
        
    except Exception as e:
        logger.error(f"Employees DELETE Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500 