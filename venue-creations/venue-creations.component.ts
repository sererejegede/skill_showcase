import {VenueReuseables} from 'src/app/Shared/utilities/venueReuseables';
import {Component, OnInit, ViewChild} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {AdminVenuesService} from 'src/app/Modules/Admin/services/admin-venues.service';
import {VenueService} from 'src/app/Modules/User/services/venue.service';
import {FormBuilder, Validators, FormGroup} from '@angular/forms';
import {NotificationService} from '../../services/notification.service';
import {MiscService} from '../../services/misc.service';
import {AdminConfigService} from 'src/app/Modules/Admin/services/admin-config.service';
import {DashboardHelpers} from '../../utilities/dashboardHelpers';
import {AdminUsersService} from 'src/app/Modules/Admin/services/admin-users.service';
import {UserService} from 'src/app/Modules/User/services/user.service';
import {TokenService} from '../../services/token.service';
import {SharedService} from '../../services/shared.service';
import {Observable} from 'rxjs';
import {distinctUntilChanged, finalize} from 'rxjs/operators';
import {CUSTOM_CONSTANTS} from '../../utilities/constants';


declare const $: any;

@Component({
  selector: 'app-venue-creations',
  templateUrl: './venue-creations.component.html',
  styleUrls: ['./venue-creations.component.css']
})
export class VenueCreationsComponent extends VenueReuseables implements OnInit {

  /**
   * @description page loader for requests calls
   */
  public isPageLoading = {
    get: DashboardHelpers.loadingPage.show,
    create: DashboardHelpers.loadingPage.show,
    creating: false
  };
  public activePage = 'stepOne';
  public venueCreationSteps = {
    step: {
      start: 1,
      end: 3
    }
  };
  public activeTab: any[] = [1];
  public venueDetails: any = {};
  public venueOwner: any = {} || [];
  public users$: Observable<any>;
  public states$: Observable<any>;
  // public asBiddingPrice: boolean;
  public createVenueForm: FormGroup;
  public make_policy_editable = false;

  /**
   * @description step1 venueCreation formGroupControls
   * @returns venueCreation form controls
   */
  static addVenueForm = () => {
    return {
      name: [null, Validators.required],
      location: [null, Validators.required],
      state_id: [null, Validators.required],
      user_id: [null, Validators.required],
      full_address: [null, Validators.required],
      capacity: [null, [Validators.required, Validators.pattern('^[0-9]*$')]],
      facilities: [null, Validators.required],
      tags: [null, Validators.required],
      booking_price: [null, Validators.required],
      is_biddable: ['0'],
      bidding_price_type: [''],
      bidding_price_type_value: [null],
      bank_account_id: [null, Validators.required],
      phone_no: [null, [Validators.required, Validators.minLength(11)]],
      video_url: [null],
      description: [null, Validators.required]
    };
  }

  constructor(private _adminUserService: AdminUsersService,
              public router: Router,
              private _adminVenueService: AdminVenuesService,
              private _userVenueService: VenueService,
              private _fb: FormBuilder,
              public notification: NotificationService,
              public miscService: MiscService,
              public configService: AdminConfigService,
              public userService: UserService,
              private sharedService: SharedService,
              public tokenService: TokenService) {
    super(tokenService, configService, miscService, userService, notification);
    // AddBank Details
    this.addBankForm = this._fb.group(VenueCreationsComponent.addBank());
    // Create Venue Details
    this.createVenueForm = this._fb.group(VenueCreationsComponent.addVenueForm());
    // VenueBeneficiary Form
    this.beneficiaryFormGroup = this._fb.group(VenueCreationsComponent.venueBeneficiaryControlForm());
  }

  ngOnInit() {
    this.setIsBiddableValidators(this.createVenueForm);
    // get all user if its admin
    if (this.role === 'ADMIN') {
      this.users$ = this._adminUserService.getAllUsers('paginate=no');
    } else {
      // remove user_id from the FormControl
      this.createVenueForm.removeControl('user_id');
    }
    // get all venue tags/venue types
    this.getAllVenueTypes();
    // get all facilities
    this.getAllVenuesFacilities();
    // get banks
    this.allBanks$ = this.getAllBanks();
    // get venue policies
    this.getAllVenuePolicies();

    this.getAllIfUser();
    // get all states
    this.states$ = this.getAllStates();
  }

  /**
   * @description clicking on tabs to get to venue step
   * @param index
   * @param tab
   */
  public onTabClick(index, tab: string) {
    const exist = this.activeTab.includes(index);
    if (exist) {
      // If user clicks on the first tab without submitting the form
      // or has a backend validation error, the formatCurrency method misbehaves
      // This block of code is to rectify that
      if (index === 1) {
        const venueForm = this.createVenueForm.value;
        if (venueForm.booking_price) {
          const booking_price = this.formatCurrency(venueForm.booking_price, null);
          this.createVenueForm.patchValue({...venueForm, booking_price});
          if (venueForm.is_biddable === '1' && venueForm.bidding_price_type === 'fixed') {
            const bidding_price_type_value = this.formatCurrency(venueForm.bidding_price_type_value, null);
            this.createVenueForm.patchValue({...venueForm, booking_price, bidding_price_type_value});
          }
        }
      }

      this.venueCreationSteps.step.start = index;
      this.activePage = tab;
      return false;
    }
  }

  /**
   * change form step onclick next / Prev buttons
   * @param type
   */
  public changeFormSteps(type: string) {
    if (this.venueCreationSteps.step.start + 1 === 4) {
      this.activePage = 'stepFour';
      this.activeTab.push(4);
    }
    switch (type) {
      case 'next':
        this.venueCreationSteps.step.start += 1; // Add to step start object
        // console.log(this.createVenueForm.value);
        if (this.venueCreationSteps.step.start === 2) {
          this.activePage = 'stepTwo';
          this.activeTab.push(2);
        } else if (this.venueCreationSteps.step.start === 3) {
          this.activePage = 'stepThree';
          this.activeTab.push(3);
        }
        break;
      default:
        this.venueCreationSteps.step.start -= 1; // substract to step start object
        if (this.venueCreationSteps.step.start === 1) {
          const venueForm = this.createVenueForm.value;
          const booking_price = this.formatCurrency(venueForm.booking_price, null);
          this.createVenueForm.patchValue({...venueForm, booking_price});
          if (venueForm.is_biddable === '1' && venueForm.bidding_price_type === 'fixed') {
            const bidding_price_type_value = this.formatCurrency(venueForm.bidding_price_type_value, null);
            this.createVenueForm.patchValue({...venueForm, booking_price, bidding_price_type_value});
          }
          this.activePage = 'stepOne';
        } else if (this.venueCreationSteps.step.start === 2) {
          this.activePage = 'stepTwo';
        } else if (this.venueCreationSteps.step.start === 3) {
          this.activePage = 'stepThree';
        }

        break;
    }
  }

  /**
   * @description complete venue creation form
   */
  public completeProcess() {
    this.isPageLoading.creating = true;
    const venue = this.createVenueForm.value;
    // Set video url
    if (venue.video_url) {
      venue['video_url'] = this.setVideoUrl(venue.video_url);
    }
    // Remove bidding_price and bidding_price_type if venue is not biddable
    if (venue['is_biddable'].toString() === '0') {
      delete venue['bidding_price'];
      delete venue['bidding_price_type'];
      delete venue['is_biddable'];
      delete venue['bidding_price_type_value'];
    }
    /*else {*/
    if (venue['bidding_price_type'] === 'fixed' && venue['bidding_price_type_value']) {
      venue['bidding_price_type_value'] = parseInt(venue['bidding_price_type_value'].replace(/,/g, ''), 10);
      // }
    }

    if (venue['booking_price']) {
      venue['booking_price'] = parseInt(venue['booking_price'].replace(/,/g, ''), 10);
    }

    if (venue['bidding_price_type_value'] && venue['bidding_price_type'] === 'ratio') {
      if (parseInt(venue['bidding_price_type_value'], 10) > 100) {
        this.isPageLoading.creating = false;
        return this.notification.showWarning(`Percentage discount should not be more than 100`, 'Warning');
      }
      if (parseInt(venue['bidding_price_type_value'], 10) < 0) {
        this.isPageLoading.creating = false;
        return this.notification.showWarning(`Percentage discount should not be less than 0`, 'Warning');
      }
    }
    if (this.role === 'ADMIN') {
      this.isAdminCreating(venue);
    } else {
      this.isUserCreating(venue);
    }
  }

  /**
   * get selected user details
   * @param userId
   */
  public getUserDetails(userId: number) {
    if (userId === undefined || userId === null) {
      return false;
    }
    // let show loader before subscribing to the observable
    this.isPageLoading.get = !this.isPageLoading.get;

    this.users$.subscribe(res => {
      // now let cancel the loader
      // this.isPageLoading.get = !this.isPageLoading.get;
      const userDetails = res.filter((data) => data.id === userId)[0];
      this.venueOwner = userDetails;
      this.showBankDetails(userDetails);
      this.isPageLoading.get = !this.isPageLoading.get;
    });

  }

  /**
   * show bank details
   * @description showBankDetails method
   * @param venueDetails
   */
  private showBankDetails(venueDetails: any) {
    if (venueDetails.bank_accounts.length === 0) {
      if (this.extraFields.account === true) {
        this.extraFields.account = false;
      }
      DashboardHelpers.dashboardAlert(
        'No Bank Account Found!',
        'No Bank account is associated with this user!',
        'error',
        'Add Bank Account'
      ).then((type) => {
        if (type.value) {
          $('#accountModal').show();
        }
      });
      return;
    }
    // Assign owner details
    this.extraFields.account = true;
  }

  /**
   * create new bank details
   */
  public createBankDetails() {
    const values = this.addBankForm.value;
    values['user_id'] = this.venueOwner.id;
    this.isPageLoading.create = !this.isPageLoading.create;
    this.processBankAccountCreation(values);
  }

  /**
   * create new bank account for venueOwner's venue
   * @param values
   */
  private processBankAccountCreation(values?: any) {
    this.sharedService.createBankAccount(values, this.role === 'ADMIN' ? 'admin' : 'user').subscribe(
      (res) => {
        this.isPageLoading.create = !this.isPageLoading.create;
        this.venueOwner['bank_accounts'] = [res, ...this.venueOwner.bank_accounts];

        this.notification.showSuccess('Account Details created successfully', 'Success!');
        // this.extraFields.account = true;
        console.log(res);

        $('#accountModal').hide(); // close user form modal
        this.addBankForm.reset(); // reset user form back to 0
      },
      (err) => {
        this.isPageLoading.create = !this.isPageLoading.create;
        // this.notification.showError(err.error.message || CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }

  /**
   * upload venue images
   * @description the method created for admin to  create multiple images
   * @param venue_id
   */
  public uploadImages(venue_id: number) {
    if (this.images.length === 0) {
      return false;
    }
    const img_array = [];
    this.images.forEach((image) => {
      img_array.push(image.img_file);
    });

    this._userVenueService.uploadVenueImage(img_array, venue_id).subscribe((res) => {
      console.log(res);
      this.images = [];
    });
  }

  /**
   * create venue policy for
   * @param venueId
   */
  private processVenuePolicy(venueId) {
    let venuePolicy = [];
    if (this.selectedPolicy.length > 0 && this.selectedSubPolicy.length > 0) {
      const subPolicy = this.selectedSubPolicy.length > 1 ? this.selectedSubPolicy.pop() : this.selectedSubPolicy;
      venuePolicy = [...this.selectedPolicy, ...subPolicy ];
    } else if (this.selectedPolicy.length > 0 && this.selectedSubPolicy.length === 0) {
      venuePolicy = [...this.selectedPolicy];
    } else if (this.selectedPolicy.length === 0 && this.selectedSubPolicy.length > 0) {
      venuePolicy = this.selectedSubPolicy.length > 1 ? [...this.selectedSubPolicy.pop() ] : [...this.selectedSubPolicy];
    }

    if (venuePolicy.length < 1) {
      return false;
    }

    const policies = [];
    for (const policy of venuePolicy) {
      if (policy.policy_description === null) {
        delete policy['policy_description'];
      }
      if (policy.sub_policy_id === null) {
        delete policy['sub_policy_id'];
      }
      policies.push(policy);
    }
    this.userService.addUserVenuePolicy({policies: policies}, venueId).subscribe(
      (res) => {
        // process to the next Api
        this.selectedPolicy = [];
        this.selectedSubPolicy = [];
        this.newPolicyDescription = null;
      },
      (err) => {
        if (err.status === 0 || err.status === 500) {
          this.notification.showInfo(
            'Venue created, but some steps were omitted. Go to venue details page to update',
            'Update Venue Details',
            5000
          );
        }
      }
    );
  }

  /**
   * @description this method show that-- Admin Role is the one creating this venue
   */
  private isAdminCreating(venue) {
    this._adminVenueService.createVenue(venue).subscribe(
      (res) => {
        this.isPageLoading.creating = false;
        // UploadImages
        this.uploadImages(res.id);
        // process stage 3
        this.processVenuePolicy(res.id);
        // change form step
        this.createVenueForm.reset();

        this.onTabClick(1, 'stepOne');
        this.activeTab = [1]; // return to initial state
        this.notification.showSuccess('Venue Space Created Successfully!', 'Success!', 10000);
      },
      (err) => {
        this.isPageLoading.creating = false;
        this.onTabClick(1, 'stepOne');
        if (err.status !== 422) {
          this.notification.showError(err.error.message || CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
        }
      }
    );
  }

  /**
   * isUserCreating
   */
  private isUserCreating(venueForm) {
    this._userVenueService.createVenue(venueForm).subscribe(
      (res) => {
        this.isPageLoading.creating = false;
        // change form step
        // console.log(res);
        // UploadImages
        this.uploadImages(res.id);
        // process stage 3
        this.processVenuePolicy(res.id);
        this.createVenueForm.reset();
        if (this.role !== 'ADMIN') {
          this.createVenueForm.removeControl('user_id');
        }
        this.onTabClick(1, 'stepOne');
        this.activeTab = [1]; // return to initial state
        this.notification.showSuccess('Venue Created Successfully!', 'Success!', 10000);
      },
      (err) => {
        this.isPageLoading.creating = false;
        this.onTabClick(1, 'stepOne');
        // this.notification.showError(err.error.message || CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }

  /**
   * closeModals and executes dependable functions
   * @param modalId
   */
  public closeModal(modalId: string) {
    $(`#${modalId}`).hide();
    this.closeVenuePolicyDesc();
  }

  /**
   * @description this method will get authenticated user belongings for creating a venue
   */
  private getAllIfUser() {
    if (this.role !== 'ADMIN') {
      const userId = this.tokenService.getAuthUser().user.id;
      this.createVenueForm.patchValue({user_id: userId});
      // get User Bank details
      this.isPageLoading.get = !this.isPageLoading.get;
      this.userService.getUserProfile().subscribe((res) => {
        this.isPageLoading.get = !this.isPageLoading.get;
        this.venueOwner.bank_accounts = res.bank_accounts;
      });
    }
  }

}
